import { NextResponse } from 'next/server';
import { ensureSchema, initialTeams, sql } from '@/lib/db';

export const runtime = 'nodejs';

function calculateScores(prediction: string[], current: string[]) {
  let total = 0;
  const details = prediction.map((team, predictedIndex) => {
    const actualIndex = current.indexOf(team);
    const diff = Math.abs(actualIndex - predictedIndex);
    total += diff;
    return { team, predicted: predictedIndex + 1, actual: actualIndex + 1, score: diff };
  });
  return { total, details };
}

export async function GET() {
  try {
    await ensureSchema();
    const standingsRows = await sql`select teams from standings where id = 1`;
    const current: string[] = standingsRows[0]?.teams ?? initialTeams;

    const rows = await sql`select id, name, prediction, created_at from submissions`;

    const submissions = rows.map((r: any) => ({
      id: r.id as string,
      name: r.name as string,
      prediction: (Array.isArray(r.prediction) ? r.prediction : (typeof r.prediction === 'string' ? JSON.parse(r.prediction) : r.prediction)) as string[],
      created_at: r.created_at,
    }));

    const withScores = submissions
      .map((s) => ({ ...s, score: calculateScores(s.prediction, current) }))
      .sort((a, b) => a.score.total - b.score.total);

    return NextResponse.json({ standings: current, submissions: withScores });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
