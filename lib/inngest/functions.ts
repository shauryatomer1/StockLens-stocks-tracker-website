import { inngest } from "@/lib/inngest/client";
import { redis } from "@/lib/redis";
import { NEWS_SUMMARY_EMAIL_PROMPT, PERSONALIZED_WELCOME_EMAIL_PROMPT } from "@/lib/inngest/prompts";
import { sendNewsSummaryEmail, sendWelcomeEmail } from "@/lib/nodemailer";
import { getAllUsersForNewsEmail, UserForNewsEmail } from "@/lib/actions/user.actions";
import { getWatchlistSymbolsByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";
import { getFormattedTodayDate } from "@/lib/utils";

export const sendSignUpEmail = inngest.createFunction(
    { id: 'sign-up-email' },
    { event: 'app/user.created' },
    async ({ event, step }) => {
        // 1. Debug Log: See exactly what data is coming in
        console.log("DEBUG - Event Data Received:", JSON.stringify(event.data, null, 2));

        const { email, name } = event.data;

        // 2. Guard Clause: Stop execution if email is missing
        if (!email) {
            console.error("CRITICAL: No email found in 'app/user.created' event data.");
            return { success: false, message: "Skipped: Missing email address" };
        }

        const userProfile = `
            - Country: ${event.data.country || 'Not specified'}
            - Investment goals: ${event.data.investmentGoals || 'Not specified'}
            - Risk tolerance: ${event.data.riskTolerance || 'Not specified'}
            - Preferred industry: ${event.data.preferredIndustry || 'Not specified'}
        `

        const prompt = PERSONALIZED_WELCOME_EMAIL_PROMPT.replace('{{userProfile}}', userProfile)

        const response = await step.ai.infer('generate-welcome-intro', {
            model: step.ai.models.gemini({ model: 'gemini-2.5-flash' }),
            body: {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: prompt }
                        ]
                    }]
            }
        })

        await step.run('send-welcome-email', async () => {
            const part = response.candidates?.[0]?.content?.parts?.[0];
            const introText = (part && 'text' in part ? part.text : null) || 'Thanks for joining Signalist. You now have the tools to track markets and make smarter moves.'

            // We use the variables extracted at the top of the function
            return await sendWelcomeEmail({ email, name, intro: introText });
        })

        return {
            success: true,
            message: 'Welcome email sent successfully'
        }
    }
)

export const sendMarketNewsSummary = inngest.createFunction(
    { id: 'market-news-summary' },
    [{ event: 'app/send.market.news' }, { cron: '0 7 * * *' }],
    async ({ step }) => {
        // Step #1: Get all users for news delivery
        const users = await step.run('get-all-users', getAllUsersForNewsEmail)

        if (!users || users.length === 0) return { success: false, message: 'No users found for news email' };

        // Step #2: For each user, get watchlist symbols -> fetch news (fallback to general)
        const results = await step.run('fetch-user-news', async () => {
            const perUser: Array<{ user: UserForNewsEmail; articles: MarketNewsArticle[] }> = [];
            for (const user of users as UserForNewsEmail[]) {
                try {
                    const symbols = await getWatchlistSymbolsByEmail(user.email);
                    let articles = await getNews(symbols);
                    // Enforce max 6 articles per user
                    articles = (articles || []).slice(0, 6);
                    // If still empty, fallback to general
                    if (!articles || articles.length === 0) {
                        articles = await getNews();
                        articles = (articles || []).slice(0, 6);
                    }
                    perUser.push({ user, articles });
                } catch (e) {
                    console.error('daily-news: error preparing user news', user.email, e);
                    perUser.push({ user, articles: [] });
                }
            }
            return perUser;
        });

        // Step #3: (placeholder) Summarize news via AI
        const userNewsSummaries: { user: UserForNewsEmail; newsContent: string | null }[] = [];

        for (const { user, articles } of results) {
            try {
                const prompt = NEWS_SUMMARY_EMAIL_PROMPT.replace('{{newsData}}', JSON.stringify(articles, null, 2));

                const response = await step.ai.infer(`summarize-news-${user.email}`, {
                    model: step.ai.models.gemini({ model: 'gemini-2.5-flash' }),
                    body: {
                        contents: [{ role: 'user', parts: [{ text: prompt }] }]
                    }
                });

                const part = response.candidates?.[0]?.content?.parts?.[0];
                const newsContent = (part && 'text' in part ? part.text : null) || 'No market news.'

                userNewsSummaries.push({ user, newsContent });
            } catch {
                console.error('Failed to summarize news for : ', user.email);
                userNewsSummaries.push({ user, newsContent: null });
            }


            // Rate limiting using Redis
            await step.run('rate-limit-check', async () => {
                const key = `rate-limit:gemini:${new Date().getMinutes()}`;
                const count = await redis.incr(key);
                if (count === 1) {
                    await redis.expire(key, 60);
                }

                // If we've exceeded 15 calls in the current minute, wait a bit
                // This is a simple cooperative rate limiting
                if (count > 15) {
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s extra if congested
                }
            });

            // Keep a small baseline delay to be safe, but reduced from 10s
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Step #4: (placeholder) Send the emails
        await step.run('send-news-emails', async () => {
            await Promise.all(
                userNewsSummaries.map(async ({ user, newsContent }) => {
                    if (!newsContent) return false;

                    return await sendNewsSummaryEmail({ email: user.email, date: getFormattedTodayDate(), newsContent })
                })
            )
        })

        return { success: true, message: 'Market news summary emails sent successfully' }
    }
)