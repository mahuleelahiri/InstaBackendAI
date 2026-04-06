# InstaBackend AI ⚡

> Type one sentence. Get a live REST API, a real seeded database, and a beautiful auto-generated admin panel — in 15 seconds.

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <your-repo>
cd sem6
npm install
```

### 2. Set Up Supabase (one-time, ~2 minutes)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New Query**
3. Copy & paste the contents of [`supabase/setup.sql`](./supabase/setup.sql) and click **Run**
4. That's it — your database is ready

### 3. Get Your API Keys

| Key | Where to find it |
|-----|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role secret |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) → Create API Key |

### 4. Configure Environment

Fill in your `.env.local` file (already created):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
GEMINI_API_KEY=AIzaSy...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🎯 How It Works

1. **Type a prompt** — e.g. *"I need a backend for a Pharmacy"*
2. **Gemini 1.5 Flash** designs 3–5 tables, columns, types, and generates 20 realistic seed rows per table
3. **Supabase** creates the tables dynamically and seeds all data
4. You land on a **live admin panel** with a sidebar, data tables, and CRUD forms
5. A **public REST API** is immediately available at:

```
GET  /api/data/{workspaceId}/{table}
POST /api/data/{workspaceId}/{table}
PUT  /api/data/{workspaceId}/{table}?id={id}
DELETE /api/data/{workspaceId}/{table}?id={id}
```

---

## 🏗️ Architecture

```
src/
├── app/
│   ├── page.tsx                          # Landing page + prompt input
│   ├── layout.tsx                        # Root layout
│   ├── globals.css                       # Neon dark theme
│   ├── api/
│   │   ├── generate/route.ts             # POST → Gemini → Blueprint JSON
│   │   ├── workspace/route.ts            # POST → Create tables + seed data
│   │   └── data/[workspaceId]/[table]/   # GET/POST/PUT/DELETE (public CRUD API)
│   └── dashboard/[workspaceId]/
│       ├── layout.tsx                    # Sidebar with table navigation
│       ├── page.tsx                      # Overview: stats + API endpoints
│       └── [table]/page.tsx             # Table view + CRUD forms
├── components/
│   ├── SmartTable.tsx                    # Blueprint-aware data grid
│   └── SmartForm.tsx                     # Blueprint-aware CRUD form
├── lib/
│   ├── gemini.ts                         # Gemini 1.5 Flash integration
│   └── supabase.ts                       # Supabase admin + anon clients
└── types/
    └── blueprint.ts                      # Shared TypeScript types
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| AI | Google Gemini 1.5 Flash |
| Database | Supabase (PostgreSQL) |
| Styling | Vanilla CSS (neon dark theme) |
| Language | TypeScript (end-to-end) |

---

## 🎪 Demo Script

1. Open the app, type *"I need a backend for a Pharmacy"*
2. Watch the 6-step ticker complete in ~10–15 seconds
3. Show the sidebar: Medicines, Prescriptions, Orders, Patients…
4. Open any table — 20+ realistic rows (real medicine names, dates, prices)
5. Hit the API URL in a browser: returns live JSON
6. Add a row via the form — it persists
7. Repeat with *"Cricket Academy"* — fully isolated workspace

---

## 📝 Notes

- `.env.local` is **not committed** to git (listed in `.gitignore`)
- Each workspace gets completely isolated tables (prefixed `ws_{id}_{table}`)
- The `exec_sql` Supabase function is locked to `service_role` only — anon users cannot call it
