## Premier League Prediction Game (2025-26)

One-page Next.js app deployed on Vercel. Players drag-and-drop to predict the final table. Submissions are stored in Neon Postgres. Live standings are updated via Google Gemini 2.5 Flash with Google Search grounding, pulling from authoritative sources such as the official Premier League tables page.

### Tech
- Next.js App Router (Node runtime)
- Neon Postgres (`@neondatabase/serverless`)
- Google Gemini (`@google/genai`) with Google Search grounding

### Local setup
1. Create a Neon project and copy the connection string.
2. Create `.env.local` with:
```
NEON_DATABASE_URL=postgres://...neon.tech/...?...sslmode=require
GEMINI_API_KEY=AIza...
```
3. Install deps and run:
```
npm install
npm run dev
```
4. Open `http://localhost:3000`.

### Deploy to Vercel
- Push this repo to GitHub and import to Vercel, or run `vercel`.
- Set Environment Variables in Vercel project:
  - `NEON_DATABASE_URL`
  - `GEMINI_API_KEY`
- Deploy.

### Database schema
Tables are created automatically on first request:
- `submissions (id text pk, name text unique, prediction jsonb, created_at timestamptz)`
- `standings (id int pk, teams jsonb, updated_at timestamptz)`

### API
- `POST /api/submit` { name, prediction: string[20] }
- `GET /api/submissions` → returns submissions with computed scores
- `GET /api/standings`
- `POST /api/update-standings` → uses Gemini + Google Search grounding to extract ordered teams, updates DB, returns snippets and citations

### Notes
- Score is sum of absolute differences between predicted and current positions (lower is better).
- A player may submit only once (enforced by unique name).
- If live fetch/parse fails, the app falls back to previous standings.
