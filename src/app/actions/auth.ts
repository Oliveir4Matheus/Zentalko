'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { signUpWithPassword, signInWithPassword, signOut } from '@/server/auth';
import { SESSION_COOKIE } from '@/server/session';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
  secure: process.env.NODE_ENV === 'production',
};

export async function signupAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const { sessionToken } = await signUpWithPassword({ email, password });
  (await cookies()).set(SESSION_COOKIE, sessionToken, COOKIE_OPTS);
  redirect('/onboarding');
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const { user, sessionToken } = await signInWithPassword({ email, password });
  (await cookies()).set(SESSION_COOKIE, sessionToken, COOKIE_OPTS);
  redirect(user.onboardingCompleted ? '/dashboard' : '/onboarding');
}

export async function logoutAction() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) await signOut(token);
  (await cookies()).delete(SESSION_COOKIE);
  redirect('/login');
}
