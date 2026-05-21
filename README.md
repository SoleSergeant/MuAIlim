# MuAIlim — AI-powered exam prep for Uzbekistan

## Quick Start

### 1. Backend (FastAPI)

```bash
cd backend
copy .env.example .env
# Edit .env with your ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY

# Windows
start.bat

# Or manually:
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

API runs at: http://localhost:8000  
Docs: http://localhost:8000/docs

### 2. Database (Supabase)

1. Go to your Supabase project → SQL Editor
2. Run `supabase/schema.sql`
3. Run `supabase/seed.sql`

### 3. Mobile App (Expo)

```bash
cd app
cp .env.example .env   # or create .env
# Set EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_API_URL

npm start
# Press 'a' for Android, 'i' for iOS, 'w' for web
```

## Environment Variables

### Backend `.env`
```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
```

### App `.env`
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000
```

> **Note for mobile testing:** Use your machine's local IP (e.g. `192.168.1.x`) instead of `localhost` for `EXPO_PUBLIC_API_URL`.

## Demo Path (Hackathon)

1. Open app → "Demo rejimda kirish" (Jasur, 12-day streak)
2. Home screen → "Mock imtihon" button
3. Answer 10 questions
4. See AI weakness analysis (Claude-powered)
5. Tap weakest topic → "Maqsadli mashq boshlash"
6. Answer 5 targeted questions
7. See improvement: 61% → 74%
8. Check Leaderboard tab

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native (Expo), Expo Router |
| Styling | React Native StyleSheet |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| AI | Claude API (claude-sonnet-4-6) |
| Spaced Rep | SM-2 algorithm |
| Auth | Supabase Auth |
