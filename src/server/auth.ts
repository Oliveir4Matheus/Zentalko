import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { prisma } from './db';
import { tryConsume, LIMITS } from './rate-limit';
import { logger } from './logger';

const log = logger.child({ module: 'auth' });

const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_COST = 10;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export interface Credentials {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  sessionToken: string;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function newSessionToken(): string {
  return randomBytes(32).toString('hex');
}

async function createSession(userId: string): Promise<string> {
  const sessionToken = newSessionToken();
  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires: new Date(Date.now() + SESSION_TTL_MS),
    },
  });
  return sessionToken;
}

export async function signUpWithPassword(creds: Credentials): Promise<AuthResult> {
  const email = normalizeEmail(creds.email);
  const retryAfter = tryConsume(`email:${email}`, LIMITS.signup);
  if (retryAfter !== null) {
    throw new Error(`Too many sign-up attempts. Try again in ${retryAfter}s.`);
  }
  if (!creds.password || creds.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('User already exists with this email');
  }

  const passwordHash = await bcrypt.hash(creds.password, BCRYPT_COST);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      onboardingCompleted: false,
    },
  });

  const sessionToken = await createSession(user.id);
  log.info({ userId: user.id }, 'auth.signup');
  return { user, sessionToken };
}

export async function signInWithPassword(creds: Credentials): Promise<AuthResult> {
  const email = normalizeEmail(creds.email);
  // Brute-force defense: cap attempts per email regardless of validity.
  const retryAfter = tryConsume(`email:${email}`, LIMITS.login);
  if (retryAfter !== null) {
    throw new Error(`Too many login attempts. Try again in ${retryAfter}s.`);
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    throw new Error('Invalid email or password');
  }
  const ok = await bcrypt.compare(creds.password, user.passwordHash);
  if (!ok) {
    log.warn({ userId: user.id }, 'auth.signin.bad_password');
    throw new Error('Invalid email or password');
  }
  const sessionToken = await createSession(user.id);
  log.info({ userId: user.id }, 'auth.signin');
  return { user, sessionToken };
}

export async function getSession(
  sessionToken: string,
): Promise<{ user: User; expires: Date } | null> {
  if (!sessionToken) return null;
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expires.getTime() < Date.now()) {
    await prisma.session.delete({ where: { sessionToken } }).catch(() => undefined);
    return null;
  }
  return { user: session.user, expires: session.expires };
}

export async function signOut(sessionToken: string): Promise<void> {
  await prisma.session.delete({ where: { sessionToken } }).catch(() => undefined);
}
