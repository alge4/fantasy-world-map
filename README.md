## StratCart (Procedural 3D DnD World Map)

Monorepo scaffold for the MVP described in `docs/Product Specification.md` and `docs/implementation_plan.md`.

### Structure

- `apps/backend` — Fastify (TypeScript) REST stubs for the draft APIs
- `apps/viewer` — Vite + TypeScript + Three.js basic 3D terrain viewer (placeholder)
- `packages/shared` — Shared types and schemas
- `supabase/migrations` — SQL to set up metadata tables (POI, tiles, vectors)
- `docs/` — Product and implementation docs

### Prerequisites

- Node.js 18+
- Supabase CLI (optional for local DB)

### Install & Run

```bash
# from repo root
npm install

# start backend (http://localhost:4000) and viewer (http://localhost:5173)
npm run dev
```

### Supabase (optional, local)

```bash
# initialize supabase project
supabase init

# start local stack
supabase start

# apply schema
supabase db reset --db-url "$(supabase db show-connection-string)" --no-seed
supabase db push
```

### Backend endpoints (stubs)

Implements the draft routes from the spec. All return stub JSON until implementations land:

- `POST /world/expand`
- `POST /edit/height`
- `POST /hydro/recompute`
- `POST /poi/settlement`
- `POST /poi/quest/suggest`
- `POST /roads/autoroute`
- `POST /style/switch`
- `POST /export/player-map`

### Notes

- Viewer currently shows a flat terrain placeholder and a style toggle (realistic ↔ atlas). It will be replaced with chunked LOD terrain and style packs in later milestones.
