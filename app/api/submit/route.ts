import { NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { randomUUID } from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    await ensureSchema();
    const { name, prediction } = await req.json();

    if (!name || !Array.isArray(prediction) || prediction.length !== 20) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Prevent resubmission by same name
    const existing = await sql`select id from submissions where lower(name) = lower(${name})`;
    if (existing.length > 0) {
      return NextResponse.json({ error: 'You have already submitted a prediction' }, { status: 409 });
    }

    const id = randomUUID();
    await sql`insert into submissions (id, name, prediction) values (${id}, ${name}, ${JSON.stringify(prediction)}::jsonb)`;
    return NextResponse.json({ ok: true, id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
