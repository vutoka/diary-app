# Internship Diary

A personal, single-user diary app: pick a day on a calendar, write what you did/learned, and keep a searchable glossary of concepts. Built with Next.js (App Router) + Tailwind CSS + Supabase (Postgres + Auth), deployed on Vercel's free tier.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a free account and a new project.
2. In the project dashboard, open **SQL Editor** → **New query**, paste the contents of `supabase/schema.sql`, and run it. This creates the `entries` and `dictionary_terms` tables with row-level security scoped to a single user.
3. Go to **Authentication → Users → Add user** and create yourself an account (email + password). This is the only account the app supports — there is no public sign-up page.
4. Go to **Project Settings → API** and copy the **Project URL** and the **anon public** key.

## 2. Configure environment variables

Copy `.env.local.example` to `.env.local` and fill in the values from step 1:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

`.env.local` is gitignored and never committed.

## 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`. Sign in with the user you created in step 1.

## 4. Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **Add New → Project**, import the repo.
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` with the same values as your `.env.local`.
4. Deploy. Vercel gives you a free `your-project.vercel.app` domain — that's your diary, reachable from any device once you log in.

## Features

- **Diary** (`/diary`) — calendar with a dot on days that have an entry, one plain-text note per day (any date, past or future), manual Save/Delete, and a search bar over entry text.
- **Dictionary** (`/dictionary`) — a global glossary of term/definition/optional-category, with add/edit/delete and a search bar over term, definition, and category.

## Project structure

- `app/(app)/diary`, `app/(app)/dictionary` — the two main pages, wrapped in a shared nav bar layout.
- `app/login` — email/password sign-in (no sign-up).
- `proxy.ts` + `lib/supabase/middleware.ts` — refreshes the Supabase session on every request and redirects unauthenticated visitors to `/login`.
- `lib/supabase/client.ts` / `server.ts` — browser/server Supabase clients (`@supabase/ssr`).
- `components/` — Calendar, EntryEditor, DiarySearch, DictionaryForm, DictionaryList, DictionarySearch, NavBar.
- `supabase/schema.sql` — table + row-level-security definitions to run in the Supabase SQL editor.
