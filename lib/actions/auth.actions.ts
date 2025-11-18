'use server';

import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";

// lib/actions/auth.actions.ts
export type SignUpFormData = {
  email: string
  password: string
  fullName?: string
  country?: string
  investmentGoals?: string
  riskTolerance?: string
  preferredIndustry?: string
}

type SuccessResult = { success: true; data: any }
type ErrorResult = { success: false; error: string; code?: string }
export type SignUpResult = SuccessResult | ErrorResult

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const signUpWithEmail = async (
  payload: SignUpFormData
): Promise<SignUpResult> => {
  const { email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry } = payload

  // Basic validations (caller/UI should also validate, but double-check here)
  if (!email || !password) {
    return { success: false, error: 'Email and password are required', code: 'MISSING_CREDENTIALS' }
  }
  if (!EMAIL_REGEX.test(email)) {
    return { success: false, error: 'Invalid email address', code: 'INVALID_EMAIL' }
  }
  if (String(password).length < 8) {
    return { success: false, error: 'Password must be at least 8 characters', code: 'WEAK_PASSWORD' }
  }

  try {
    // Call auth provider — adjust the call shape if your SDK differs
    const response = await auth.api.signUpEmail({
      body: { email, password, name: fullName || '' },
    })

    // Defensive checks: if response is falsy or has an `error` field, treat as failure
    if (!response) {
      return { success: false, error: 'Empty response from auth provider', code: 'EMPTY_RESPONSE' }
    }
    // If your auth SDK returns an error inside the response, handle it:
    if ((response as any).error) {
      const msg = (response as any).error?.message ?? 'Sign up failed'
      return { success: false, error: msg, code: 'AUTH_ERROR' }
    }

    // Fire-and-forget event: do NOT block signup on analytics/event failures.
    // Keep it non-blocking so client UX isn't impacted.
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
          // optionally include id if response contains it:
          // userId: (response as any)?.user?.id,
        },
      }).catch((evErr: any) => {
        // Log event errors but don't surface to caller
        console.error('inngest send failed (non-blocking):', evErr)
      })
    } catch (evtErr) {
      // Defensive — log and continue
      console.error('inngest invocation failed (non-blocking):', evtErr)
    }

    // All good
    return { success: true, data: response }
  } catch (err: any) {
    // Map known SDK errors to friendly messages if you can
    console.error('signUpWithEmail error:', err)
    const message = err?.message ?? 'Sign up failed'
    const code = err?.code ?? 'SIGNUP_EXCEPTION'
    return { success: false, error: message, code }
  }
}


export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({ body: { email, password } })

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign in failed', e)
        return { success: false, error: 'Sign in failed' }
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}