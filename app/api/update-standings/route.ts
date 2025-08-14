import { NextResponse } from 'next/server';
import { ensureSchema, sql, initialTeams } from '@/lib/db';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

function buildAddCitations(response: any): string[] {
  try {
    const supports = response.candidates?.[0]?.groundingMetadata?.groundingSupports ?? [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const links: string[] = [];
    for (const support of supports) {
      const indices: number[] = support.groundingChunkIndices ?? [];
      for (const i of indices) {
        const uri = chunks[i]?.web?.uri;
        if (uri && !links.includes(uri)) links.push(uri);
      }
    }
    // Also include any direct chunk URIs if supports absent
    if (links.length === 0) {
      for (const c of chunks) {
        const uri = c?.web?.uri;
        if (uri && !links.includes(uri)) links.push(uri);
      }
    }
    return links.slice(0, 3);
  } catch {
    return [];
  }
}

function tryParseTeams(text: string): string[] | null {
  try {
    const jsonStart = text.indexOf('{');
    const jsonText = jsonStart >= 0 ? text.slice(jsonStart) : text;
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed.teams) && parsed.teams.length === 20) return parsed.teams as string[];
  } catch {}
  return null;
}

export async function POST() {
  try {
    await ensureSchema();

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Extract the current standings (ordered 1..20) for the English Premier League 2025-26 as of today from authoritative sources. Respond ONLY with JSON in the form {"teams": string[]} with exactly 20 team names in table order. Do not include any prose.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const text = (response as any).text ?? '';
    const citations = buildAddCitations(response);

    let teams = tryParseTeams(text);

    if (!teams) {
      // Fallback to existing/initial teams
      const rows = await sql`select teams from standings where id = 1`;
      teams = rows[0]?.teams ?? initialTeams;
    }

    await sql`insert into standings (id, teams, updated_at) values (1, ${JSON.stringify(teams)}::jsonb, now())
               on conflict (id) do update set teams = excluded.teams, updated_at = now()`;

    const snippets: string[] = [];
    const snippetText = String(text || '').slice(0, 240);
    if (snippetText) snippets.push(snippetText);
    snippets.push(...citations.map((u, i) => `Source ${i + 1}: ${u}`));

    return NextResponse.json({ ok: true, teams, snippets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
