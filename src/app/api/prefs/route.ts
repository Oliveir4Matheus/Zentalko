import { NextResponse } from 'next/server';
import { writePrefs, type Prefs } from '@/lib/prefs';

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Partial<Prefs>;
  const saved = await writePrefs(body);
  return NextResponse.json({ ok: true, prefs: saved });
}
