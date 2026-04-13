import { describe, it, expect, beforeEach } from 'vitest';
import { resetDatabase } from '../helpers/db';
// @ts-expect-error — red phase
import { signUpWithPassword, signInWithPassword, getSession } from '@/server/auth';

describe('auth (email + password)', () => {
  beforeEach(async () => resetDatabase());

  it('should create a new user and return a session token on signup', async () => {
    const { user, sessionToken } = await signUpWithPassword({
      email: 'novo@example.com',
      password: 'senha-forte-1',
    });

    expect(user.email).toBe('novo@example.com');
    expect(sessionToken).toMatch(/.+/);
  });

  it('should reject signup with a weak password', async () => {
    await expect(
      signUpWithPassword({ email: 'a@b.com', password: '123' }),
    ).rejects.toThrow(/password/i);
  });

  it('should reject duplicate email', async () => {
    await signUpWithPassword({ email: 'dup@example.com', password: 'senha-forte-1' });

    await expect(
      signUpWithPassword({ email: 'dup@example.com', password: 'senha-forte-1' }),
    ).rejects.toThrow(/already exists|already registered/i);
  });

  it('should authenticate an existing user with correct password', async () => {
    await signUpWithPassword({ email: 'a@b.com', password: 'senha-forte-1' });

    const { sessionToken } = await signInWithPassword({
      email: 'a@b.com',
      password: 'senha-forte-1',
    });

    const session = await getSession(sessionToken);
    expect(session?.user.email).toBe('a@b.com');
  });

  it('should reject sign-in with wrong password', async () => {
    await signUpWithPassword({ email: 'a@b.com', password: 'senha-forte-1' });

    await expect(
      signInWithPassword({ email: 'a@b.com', password: 'wrong' }),
    ).rejects.toThrow(/invalid/i);
  });

  it('should mark new users as onboardingCompleted=false by default', async () => {
    const { user } = await signUpWithPassword({
      email: 'newbie@example.com',
      password: 'senha-forte-1',
    });

    expect(user.onboardingCompleted).toBe(false);
  });
});
