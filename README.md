# Dragonfly Learning

On-demand CPD learning platform for Dragonfly Psychotherapy — the sister site to the
[main site](https://dragonflypsychotherapy.co.uk) and [shop](https://dragonflyshop.co.uk).

- **Domain:** `dragonflylearning.co.uk`
- **Local port:** `3002`
- **Stack:** Next.js 14 (App Router, TypeScript) · CSS Modules · Clerk auth · Vercel Postgres + Drizzle ORM · Stripe Checkout · Bunny.net Stream · `@react-pdf/renderer` certificates

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values (see below)
npm run dev                  # http://localhost:3002
```

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Group | Vars |
|-------|------|
| Clerk | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, sign-in/up URLs |
| Postgres | `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING` (auto-injected by Vercel Storage) |
| Stripe | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` |
| Bunny | `NEXT_PUBLIC_BUNNY_LIBRARY_ID`, `BUNNY_STREAM_API_KEY` |
| Site | `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_MAIN_SITE_URL` |

Pull production/preview env vars locally with:

```bash
vercel env pull .env.local
```

## Database (Vercel Postgres + Drizzle)

1. In the Vercel project: **Storage → Create → Postgres**. Env vars are injected automatically.
2. Push the schema:

```bash
npm run db:push        # apply lib/db/schema.ts to the database
npm run db:studio      # optional: browse data
npm run db:seed        # optional: insert one draft sample course
```

Tables: `courses`, `purchases`, `completions` (see `lib/db/schema.ts`).

## Auth (Clerk)

1. Create a Clerk application (free tier). Enable **email/password** and **magic link**.
2. Add the publishable + secret keys to your env.
3. In **Sessions → Customize session token**, add a custom claim so middleware can read the role:

   ```json
   { "metadata": "{{user.public_metadata}}" }
   ```

4. To make Vicky an admin: in the Clerk dashboard, open her user → **Metadata → Public** and set:

   ```json
   { "role": "admin" }
   ```

   Admin routes (`/admin/*`) return 404 to everyone else.

## Video (Bunny.net Stream)

- Upload MP4s in the **Bunny dashboard only** (no in-app upload).
- Paste the video **GUID** into the course form (`Bunny video ID`). The library ID is pre-filled from `NEXT_PUBLIC_BUNNY_LIBRARY_ID`.
- In Bunny, **domain-restrict** playback to `dragonflylearning.co.uk` (add `localhost` for dev if supported).
- Completion = **90% watched**. Progress is posted to `/api/completion` every 30s via player.js.

## Payments (Stripe)

Mirrors the shop's redirect Checkout pattern.

1. `POST /api/checkout` with `{ courseId }`.
2. Paid course → creates a `pending` purchase, then a Stripe Checkout Session, then redirects.
3. Webhook `checkout.session.completed` (`/api/webhooks/stripe`) → marks the purchase `completed` and creates a `completions` row.
4. Free course → skips Stripe, inserts a `completed` £0 purchase, redirects straight to watch.

Use **live** keys on production Vercel. The same Stripe account as the shop is fine, but create a
**separate webhook endpoint** for the learning domain and use its signing secret as `STRIPE_WEBHOOK_SECRET`.

## Certificates

Generated server-side with `@react-pdf/renderer` at `/api/certificate/[courseId]` once a course is
complete. Includes the teal Dragonfly Learning bar, attendee name, course title, CPD hours, completion
date, certificate UUID, the "not accredited" disclaimer, and "Dr Victoria Froome".

## Routes

| Route | Access | Purpose |
|-------|--------|---------|
| `/` | Public | Hero, featured courses, about blurb |
| `/courses` | Public | Grid of published courses |
| `/courses/[slug]` | Public | Detail + smart buy button |
| `/courses/[slug]/watch` | Auth + owned | Bunny player + progress |
| `/courses/[slug]/certificate` | Auth + completed | PDF download |
| `/dashboard` | Auth | My courses, progress, certificates |
| `/admin/*` | Admin | Course CRUD, purchases, stats |
| `/sign-in`, `/sign-up` | Public | Clerk |

## Deploy (Vercel)

1. New Vercel project linked to this repository (root directory is the repo root — no subdirectory).
2. Add all env vars (live keys in Production).
3. Add Postgres via the Storage tab; run `npm run db:push`.
4. Point `dragonflylearning.co.uk` DNS at Vercel.
5. Create the Stripe webhook endpoint for the production URL → set `STRIPE_WEBHOOK_SECRET`.
6. Domain-restrict the Bunny library to the production domain.
7. Set Vicky's Clerk `publicMetadata.role = "admin"`.

## Out of scope (v1)

Slides/handouts upload, course categories/filters, accreditation workflows, quizzes, in-app video
upload, and a separate privacy policy (links to the main site's policy).
