import { NextResponse } from 'next/server';
import { signUpWithPassword } from '@/server/auth';
import { SESSION_COOKIE } from '@/server/session';

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get('email') ?? '');
  const password = String(form.get('password') ?? '');
  try {
    const { sessionToken } = await signUpWithPassword({ email, password });
    const url = new URL('/onboarding', req.url);
    const res = NextResponse.redirect(url, { status: 303 });
    res.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch (err) {
    const url = new URL('/signup', req.url);
    url.searchParams.set('error', (err as Error).message);
    return NextResponse.redirect(url, { status: 303 });
  }
}
