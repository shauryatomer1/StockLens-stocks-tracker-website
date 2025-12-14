import nodemailer from 'nodemailer';
import { WELCOME_EMAIL_TEMPLATE, NEWS_SUMMARY_EMAIL_TEMPLATE } from "@/lib/nodemailer/templates";

const SENDER_WELCOME = `"StockLens" <stocklens@shauryatomer@gmail.com>`;
const SENDER_NEWS = `"StockLens News" <stocklens@shauryatomer@gmail.com>`;

if (!process.env.NODEMAILER_EMAIL || !process.env.NODEMAILER_PASSWORD) {
  console.warn('[nodemailer] NODEMAILER_EMAIL or NODEMAILER_PASSWORD is not set. Emails will fail if you try to send them.');
}

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL!,
    pass: process.env.NODEMAILER_PASSWORD!,
  },
});

// helper to validate email
function isValidEmail(e: unknown): e is string {
  return typeof e === 'string' && e.trim().length > 0;
}

export const sendWelcomeEmail = async ({ email, name, intro }: WelcomeEmailData) => {
  if (!isValidEmail(email)) {
    console.error('[sendWelcomeEmail] Missing/invalid recipient email:', email);
    throw new Error('sendWelcomeEmail called without a valid email');
  }

  const safeName = typeof name === 'string' && name.trim() !== '' ? name : 'there';
  const safeIntro = typeof intro === 'string' ? intro : 'Thanks for joining StockLens. You now have the tools to track markets and make smarter moves.';

  const htmlTemplate = (WELCOME_EMAIL_TEMPLATE || '')
    .replace('{{name}}', safeName)
    .replace('{{intro}}', safeIntro);

  const mailOptions = {
    from: SENDER_WELCOME,
    to: email,
    subject: `Welcome to StockLens - your stock market toolkit is ready!`,
    text: 'Thanks for joining StockLens',
    html: htmlTemplate,
  };

  try {
    const res = await transporter.sendMail(mailOptions);
    console.log('[sendWelcomeEmail] Email sent', { to: email, messageId: res?.messageId });
  } catch (err) {
    console.error('[sendWelcomeEmail] Failed to send email to', email, err);
    throw err;
  }
};

export const sendNewsSummaryEmail = async (
  { email, date, newsContent }: { email: string; date: string; newsContent: string }
): Promise<void> => {
  if (!isValidEmail(email)) {
    console.error('[sendNewsSummaryEmail] Missing/invalid recipient email:', email);
    throw new Error('sendNewsSummaryEmail called without a valid email');
  }

  const safeDate = typeof date === 'string' ? date : '';
  const safeNewsContent = typeof newsContent === 'string' ? newsContent : 'No market news.';

  const htmlTemplate = (NEWS_SUMMARY_EMAIL_TEMPLATE || '')
    .replace('{{date}}', safeDate)
    .replace('{{newsContent}}', safeNewsContent);

  const mailOptions = {
    from: SENDER_NEWS,
    to: email,
    subject: `📈 Market News Summary Today - ${safeDate}`,
    text: `Today's market news summary from StockLens`,
    html: htmlTemplate,
  };

  try {
    const res = await transporter.sendMail(mailOptions);
    console.log('[sendNewsSummaryEmail] Email sent', { to: email, messageId: res?.messageId });
  } catch (err) {
    console.error('[sendNewsSummaryEmail] Failed to send news email to', email, err);
    throw err;
  }
};
