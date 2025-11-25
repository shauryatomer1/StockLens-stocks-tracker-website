// lib/better-auth/auth.ts
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { nextCookies } from "better-auth/next-js";

/**
 * IMPORTANT:
 * - After changing this file, fully restart your dev server so the new config is loaded.
 * - Ensure MONGODB_URI and BETTER_AUTH_SECRET are set in your environment.
 */

const client = new MongoClient(process.env.MONGODB_URI!);

/**
 * Export a single `auth` instance used across the app.
 * The critical fix: enable email/password sign-up explicitly.
 */
export const auth = betterAuth({
  // Pass a DB instance. This is the recommended shape for the mongodb adapter.
  // Replace "test" with your actual DB name if needed.
  database: mongodbAdapter(client.db("test")),

  // Secret used by Better Auth — ensure this is set in env
  secret: process.env.BETTER_AUTH_SECRET,

  /**
   * ====== Enable Email + Password Authentication ======
   * `enabled: true` allows the feature.
   * `disableSignUp: false` explicitly allows sign-ups.
   * `requireEmailVerification` can be toggled as needed.
   */
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    requireEmailVerification: false,
    // optional:
    // minPasswordLength: 8,
    // maxPasswordLength: 128,
  },

  // Custom user fields you want to store
  user: {
    additionalFields: {
      country: { type: "string" },
      investmentGoals: { type: "string" },
      riskTolerance: { type: "string" },
      preferredIndustry: { type: "string" },
    },
  },

  // Any Better Auth plugins you use (e.g. nextCookies for Next.js)
  plugins: [nextCookies()],
});

/* Debugging helper (temporary)
   Uncomment while debugging to confirm the runtime config is loaded.
   Remove or comment out in production.
*/
// console.log("BetterAuth: emailAndPassword enabled =", auth?.options?.emailAndPassword?.enabled);
