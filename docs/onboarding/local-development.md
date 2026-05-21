# Local Development

Step-by-step setup for running the full platform stack locally.

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | Runtime |
| pnpm | 9+ | Package manager |
| Docker | 24+ | Local Supabase |
| Supabase CLI | Latest | Local DB management |

Install Supabase CLI:

```bash
npm install -g supabase
```

---

## 1. Clone and Install

```bash
git clone https://github.com/diese-tech/salbot
cd salbot
pnpm install
```

---

## 2. Environment Setup

```bash
cp .env.example .env.local
```

Edit `.env.local` with:

- A Discord test bot token (create a test application at discord.com/developers)
- A test Discord guild ID
- Local Supabase values (filled in after step 3)

---

## 3. Start Local Supabase

```bash
supabase start
```

This starts a local Supabase stack (PostgreSQL, Auth, Storage, Studio) via Docker.

On first run, it will print your local credentials:

```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
anon key: eyJ...
service_role key: eyJ...
```

Copy `API URL`, `anon key`, and `service_role key` into `.env.local`.

---

## 4. Run Migrations

```bash
supabase db push
```

This applies all migrations from `database/migrations/` to your local database.

Seed development data:

```bash
pnpm run db:seed
```

---

## 5. Generate TypeScript Types

```bash
pnpm --filter @salbot/db generate
```

This regenerates `packages/db/src/types/database.types.ts` from your local schema.

---

## 6. Start the Bot

```bash
pnpm --filter @salbot/bot dev
```

Before starting, deploy commands to your test guild:

```bash
pnpm --filter @salbot/bot deploy:commands
```

---

## 7. Start the Web Panel

```bash
pnpm --filter @salbot/web dev
```

Web panel runs at `http://localhost:3000`.

---

## 8. Start ForgeLens (Optional)

ForgeLens is only required if you're working on OCR features:

```bash
pnpm --filter @salbot/forgelens dev
```

---

## Common Tasks

### Reset local database

```bash
supabase db reset
pnpm run db:seed
```

### Add a new migration

```bash
supabase migration new your_migration_name
```

Edit the generated file in `supabase/migrations/`. Then:

```bash
supabase db push
pnpm --filter @salbot/db generate
```

### View local Supabase Studio

Open `http://localhost:54323` for a full database GUI.

---

## Troubleshooting

**Bot commands not showing in Discord**

Run `pnpm --filter @salbot/bot deploy:commands` after any command registration changes. Discord caches command lists.

**Types out of sync**

Run `pnpm --filter @salbot/db generate` after any schema changes.

**Supabase won't start**

Ensure Docker is running. Try `supabase stop && supabase start`.

**pnpm workspace issues**

Run `pnpm install` from the monorepo root. Do not run `npm install` in individual packages.
