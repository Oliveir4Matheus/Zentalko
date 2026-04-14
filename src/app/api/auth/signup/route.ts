import { NextResponse } from 'next/server';
import { signUpWithPassword } from '@/server/auth';
import { SESSION_COOKIE } from '@/server/session';

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get('email') ?? '');
  const password = String(form.get('password') ?? '');
  try {
    const { sessionToken } = await signUpWithPassword({ email, password });
    const res = new NextResponse(null, {
      status: 303,
      headers: { Location: '/onboarding' },
    });
    res.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      secure: process.env.NODE_ENV === 'production',
    });
    return res;
  } catch (err) {
    const location = `/signup?error=${encodeURIComponent((err as Error).message)}`;
    return new NextResponse(null, { status: 303, headers: { Location: location } });
  }
}
