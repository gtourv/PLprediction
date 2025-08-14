import { NextResponse } from 'next/server';
import { ensureSchema, initialTeams, sql } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await ensureSchema();
    const rows = await sql`select teams, updated_at from standings where id = 1`;
    if (rows.length === 0) {
      return NextResponse.json({ teams: initialTeams, updated_at: null });
    }
    return NextResponse.json({ teams: rows[0].teams as string[], updated_at: rows[0].updated_at });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
