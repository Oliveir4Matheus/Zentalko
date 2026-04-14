import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { logger } from '@/server/logger';

const log = logger.child({ module: 'health' });

type Check = { status: 'ok' | 'down' | 'skipped'; latencyMs?: number; error?: string };

async function checkDb(): Promise<Check> {
  const t = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', latencyMs: Date.now() - t };
  } catch (err) {
    return { status: 'down', error: (err as Error).message };
  }
}

async function checkMinio(): Promise<Check> {
  const endpoint = process.env.STORAGE_ENDPOINT;
  if (!endpoint) return { status: 'skipped' };
  const t = Date.now();
  try {
    const { Client } = await import('minio');
    const url = new URL(endpoint.startsWith('http') ? endpoint : `http://${endpoint}`);
    const client = new Client({
      endPoint: url.hostname,
      port: url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80,
      useSSL: url.protocol === 'https:',
      accessKey: process.env.STORAGE_ACCESS_KEY ?? '',
      secretKey: process.env.STORAGE_SECRET_KEY ?? '',
    });
    await client.bucketExists(process.env.STORAGE_BUCKET ?? 'learnenglish');
    return { status: 'ok', latencyMs: Date.now() - t };
  } catch (err) {
    return { status: 'down', error: (err as Error).message };
  }
}

async function checkTts(): Promise<Check> {
  const url = process.env.TTS_URL;
  if (!url) return { status: 'skipped' };
  const t = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const resp = await fetch(url.replace(/\/$/, '') + '/health', { signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) return { status: 'down', error: `HTTP ${resp.status}` };
    return { status: 'ok', latencyMs: Date.now() - t };
  } catch (err) {
    return { status: 'down', error: (err as Error).message };
  }
}

export async function GET() {
  const [db, storage, tts] = await Promise.all([checkDb(), checkMinio(), checkTts()]);
  // DB is the only hard dependency. TTS down means no audio; storage down
  // means no audio/epub blob persistence — both degrade UX but the app
  // still serves reviews, reading (with MyMemory fallback), auth, etc.
  const dbOk = db.status === 'ok';
  const allOk = dbOk && storage.status !== 'down' && tts.status !== 'down';
  const body = {
    status: allOk ? 'ok' : dbOk ? 'degraded' : 'down',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: { db, storage, tts },
  };
  if (!allOk) log.warn(body, allOk ? 'health.ok' : 'health.degraded');
  // Return 200 while DB is reachable so orchestrators (Coolify, Kubernetes)
  // don't kill the container for non-critical degradation.
  return NextResponse.json(body, { status: dbOk ? 200 : 503 });
}
