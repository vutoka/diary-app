# Internship Diary

A personal, single-user diary app: pick a day on a calendar, write what you did/learned (with pasted screenshots), keep a searchable glossary of concepts, and collect feature requests for the app itself. Built with Next.js (App Router) + Tailwind CSS + Supabase (Postgres + Auth + Storage), deployed on Vercel's free tier.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a free account and a new project.
2. In the project dashboard, open **SQL Editor** → **New query**, paste the contents of `supabase/schema.sql`, and run it. This creates the `entries`, `dictionary_terms` and `requests` tables and the private `entry-images` storage bucket, all with row-level security scoped to a single user. (With the Supabase CLI you can instead run `supabase link` and `supabase db push` to apply `supabase/migrations/`.)
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

- **Diary** (`/diary`) — calendar with a dot on days that have an entry, one plain-text note per day (any date, past or future), and a search bar over entry text.
  - Links (`http(s)://…`, `www.…`) in a note are clickable.
  - Paste a screenshot (Ctrl+V) into a note: it is downscaled, stored in Supabase Storage and shown inline at the cursor via an `[[img:id]]` marker. Clicking an image opens it in an in-app viewer, where it can also be deleted. Deleting a day's entry deletes its images too.
- **Dictionary** (`/dictionary`) — a global glossary of term/definition/optional-category, with add/edit/delete and a search bar over term, definition, and category.
- **Requests** (`/requests`) — a list of feature requests for the app (title, optional description, open/done checkbox) with add/edit/delete and search.
- **Autosave** — everywhere you type (diary notes and the add/edit forms), changes are saved 10 seconds after your last edit, and immediately when you switch day/page or hide the tab. Failed saves retry, and unsaved text is kept in `localStorage` as a backup.

## Project structure

- `app/(app)/diary`, `app/(app)/dictionary`, `app/(app)/requests` — the main pages, wrapped in a shared nav bar layout.
- `app/login` — email/password sign-in (no sign-up).
- `proxy.ts` + `lib/supabase/middleware.ts` — refreshes the Supabase session on every request and redirects unauthenticated visitors to `/login`.
- `lib/supabase/client.ts` / `server.ts` — browser/server Supabase clients (`@supabase/ssr`).
- `lib/useAutosave.ts` — the shared autosave hook; `lib/useEntryImages.ts`, `lib/images.ts`, `lib/imageTokens.ts` — diary image upload, resizing and `[[img:id]]` markers.
- `components/` — Calendar, EntryEditor, EntryContent, EntryImageGallery, ImageLightbox, LinkifiedText, DiarySearch, Dictionary* and Request* forms/lists, SaveStatus, NavBar.
- `supabase/schema.sql` — full database definition; `supabase/migrations/` — the same as incremental migrations for the Supabase CLI.

## Deploying updates

Pushing to `main` deploys automatically. If a new production deployment finishes but the live site still shows the old version, open the project in Vercel → **Deployments** and use **⋯ → Promote to Production** on the newest one.
