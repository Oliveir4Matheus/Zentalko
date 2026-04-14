import { NextResponse } from 'next/server';
import { signInWithPassword } from '@/server/auth';
import { SESSION_COOKIE } from '@/server/session';

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get('email') ?? '');
  const password = String(form.get('password') ?? '');
  try {
    const { user, sessionToken } = await signInWithPassword({ email, password });
    const target = user.onboardingCompleted ? '/dashboard' : '/onboarding';
    const res = new NextResponse(null, { status: 303, headers: { Location: target } });
    res.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch {
    return new NextResponse(null, { status: 303, headers: { Location: '/login?error=1' } });
  }
}
