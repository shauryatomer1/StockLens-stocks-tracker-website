'use server';

import { auth } from "@/lib/better-auth/auth";
import { inngest } from "@/lib/inngest/client";
import { headers } from "next/headers";

export type SignUpFormData = {
  email: string;
  password: string;
  fullName?: string;
  country?: string;
  investmentGoals?: string;
  riskTolerance?: string;
  preferredIndustry?: string;
};

export type SignInFormData = {
  email: string;
  password: string;
};

type SuccessResult = { success: true; data: any };
type ErrorResult = { success: false; error: string; code?: string };
export type SignUpResult = SuccessResult | ErrorResult;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const signUpWithEmail = async (
  payload: SignUpFormData
): Promise<SignUpResult> => {
  const { email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry } = payload;

  if (!email || !password) {
    return { success: false, error: 'Email and password are required', code: 'MISSING_CREDENTIALS' };
  }
  if (!EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Invalid email address', code: 'INVALID_EMAIL' };
  }
  if (String(password).length < 8) {
    return { success: false, error: 'Password must be at least 8 characters', code: 'WEAK_PASSWORD' };
  }

  try {
    const response = await auth.api.signUpEmail({
    body: {
        email,
        password,
        // Fix: Use || "" to ensure it is never undefined
        name: fullName || "", 
        country: country || "",
        investmentGoals: investmentGoals || "",
        riskTolerance: riskTolerance || "",
        preferredIndustry: preferredIndustry || "",
    },
    headers: await headers(),
});

    if (!response) {
      return { success: false, error: 'Empty response from auth provider', code: 'EMPTY_RESPONSE' };
    }

    if ((response as any).error) {
      const msg = (response as any).error?.message ?? 'Sign up failed';
      return { success: false, error: msg, code: 'AUTH_ERROR' };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      void inngest.send({
        name: 'app/user.created',
        data: {
          email,
          name: fullName,
          country,
          investmentGoals,
          riskTolerance,
          preferredIndustry,
          createdAt: new Date().toISOString(),
        },
      }).catch((evErr: any) => {
        console.error('inngest send failed:', evErr);
      });
    } catch (evtErr) {
      console.error('inngest invocation failed:', evtErr);
    }

    return { success: true, data: response };
  } catch (err: any) {
    console.error('signUpWithEmail error:', err);
    const message = err?.message ?? 'Sign up failed';
    const code = err?.code ?? 'SIGNUP_EXCEPTION';
    return { success: false, error: message, code };
  }
};

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
  try {
    const response = await auth.api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });
    return { success: true, data: response };
  } catch (e) {
    console.log('Sign in failed', e);
    return { success: false, error: 'Sign in failed' };
  }
};

export const signOut = async () => {
  try {
    await auth.api.signOut({ headers: await headers() });
    return { success: true, data: null };
  } catch (e) {
    console.log('Sign out failed', e);
    return { success: false, error: 'Sign out failed' };
  }
};