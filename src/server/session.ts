import { cookies } from 'next/headers';
import { getSession } from './auth';

export const SESSION_COOKIE = 'session_token';

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const s = await getSession(token);
  return s?.user ?? null;
}

export async function requireUserId(): Promise<string> {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');
  return user.id;
}
