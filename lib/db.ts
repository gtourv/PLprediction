import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.NEON_DATABASE_URL;
if (!databaseUrl) {
  // Do not throw at import time on serverless; routes can handle absence gracefully
  console.warn('NEON_DATABASE_URL is not set. API routes will operate in memory only.');
}

export const sql = databaseUrl ? neon(databaseUrl) : (async () => { throw new Error('NEON_DATABASE_URL not configured'); }) as any;

export const initialTeams: string[] = [
  'Arsenal', 'Aston Villa', 'Bournemouth', 'Brentford', 'Brighton and Hove Albion',
  'Burnley', 'Chelsea', 'Crystal Palace', 'Everton', 'Fulham',
  'Leeds United', 'Liverpool', 'Manchester City', 'Manchester United', 'Newcastle United',
  'Nottingham Forest', 'Sunderland', 'Tottenham Hotspur', 'West Ham United', 'Wolverhampton Wanderers'
];

export async function ensureSchema(): Promise<void> {
  if (!databaseUrl) return;
  await sql`
    create table if not exists submissions (
      id text primary key,
      name text unique not null,
      prediction jsonb not null,
      created_at timestamptz not null default now()
    );
  `;
  await sql`
    create table if not exists standings (
      id int primary key,
      teams jsonb not null,
      updated_at timestamptz not null default now()
    );
  `;
  // Ensure singleton row with id=1 exists
  const rows = await sql<{ id: number }[]>`select id from standings where id = 1`;
  if (rows.length === 0) {
    await sql`insert into standings (id, teams) values (1, ${JSON.stringify(initialTeams)}::jsonb)`;
  }
}

export type SubmissionRow = {
  id: string;
  name: string;
  prediction: string[];
  created_at: string;
};

export type StandingsRow = {
  id: number;
  teams: string[];
  updated_at: string;
};
