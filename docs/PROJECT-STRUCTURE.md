# Project structure

Canonical guide for this Next.js 16 monolith. Agents and contributors should read this before implementing features.

When unsure about Next.js 16 APIs, read `node_modules/next/dist/docs/` — this stack differs from older Next.js.

## Stack

Next.js 16 App Router · React 19 · Tailwind 4 · NextAuth v5 (`auth.ts`) · MySQL + Drizzle · Bun · `proxy.ts` (not middleware) for `/dashboard/*`

## Architecture flow

```
page.tsx → queries.ts → requireDashboardAccess() → createXModule()
  → Controller → Service → Usecase → db (Drizzle) → MySQL

client organism → actions.ts ("use server") → createXAction()
  → Controller → … → revalidatePath()

LoginForm → signIn() → /api/auth/[...nextauth] → auth.ts
proxy.ts → JWT check on /dashboard/*
```

## Folder tree

```
app/
├── layout.tsx, page.tsx, actions.ts
├── api/auth/[...nextauth]/route.ts
├── login/page.tsx
└── dashboard/
    ├── layout.tsx, actions.ts, cached-actions.ts
    └── <feature>/
        ├── page.tsx
        ├── queries.ts
        ├── actions.ts
        └── cached-actions.ts

components/{ui,molecules,organisms}/
db/{index.ts,api-modules,controller,service,usecase}/
drizzle/{schema.ts,relations.ts,*.sql}
lib/{auth,types,utils}/
auth.ts, proxy.ts, next.config.ts
```

## Folder roles

| Path | Role |
| ---- | ---- |
| `app/` | Routes, layouts, pages (Server Components default) |
| `app/dashboard/<feature>/queries.ts` | Server **reads** + auth guard |
| `app/dashboard/<feature>/actions.ts` | Server **writes** (`"use server"`) |
| `app/dashboard/<feature>/cached-actions.ts` | `"use cache: remote"` slices (optional) |
| `app/actions.ts` | Auth-guarded `createXAction()` factories → controllers |
| `app/api/` | Route handlers (auth + rare REST only) |
| `components/ui/` | shadcn primitives |
| `components/molecules/` | Small blocks |
| `components/organisms/` | Page sections |
| `db/usecase/<domain>/` | Single Drizzle operation |
| `db/service/` | Orchestrates use cases |
| `db/controller/<domain>/` | Interface + controller |
| `db/api-modules/` | `createXModule()` DI factories |
| `drizzle/schema.ts` | Tables (never query from pages) |
| `lib/types/` | DTOs |
| `lib/auth/` | Guards, password, Google token verify |
| `auth.ts` | NextAuth config |
| `proxy.ts` | JWT gate for dashboard routes |

## Decision tree

```
UI mostly static?     → Server Component page.tsx
Forms/hooks/events?   → components/ + "use client"
External HTTP only?   → app/api/.../route.ts

Read data?            → queries.ts (+ cached-actions.ts)
Write data?           → actions.ts ("use server")
Touch DB?             → usecase → service → controller → api-module
```

## Hard rules

1. **Never import usecases from pages/components** — use `createXModule()` or `createXAction()`.
2. **`await searchParams`** in pages/layouts (Next.js 16 — it is a Promise).
3. **`requireDashboardAccess()`** in queries; **`createXAction()`** in `app/actions.ts` wraps controller with same guard. Owner-only → `requireOwnerAccess()`.
4. **Server Components by default** — `"use client"` only for hooks/browser/events.
5. **Mutations return `{ success, message }`**, call `revalidatePath(...)`, validate input in the action.
6. **Client mutations** use `useTransition` + server action (see existing organisms).
7. **Prefer Server Actions + queries** over new REST routes for dashboard UI.
8. **Minimize scope** — match existing naming and layer patterns in the domain you touch.

## Read flow

```tsx
// app/dashboard/<feature>/page.tsx
export default async function Page({
  searchParams,
}: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const data = await getThings({ page: Number(sp.page ?? 1) }, "cached");
  return <ThingConsole data={data} />;
}
```

```ts
// queries.ts
export async function getThings(main, cache: "cached" | "not_cached" = "not_cached") {
  await requireDashboardAccess();
  if (cache === "cached") return getThingsCached(main.page);
  return createThingsModule().getThings(main.page);
}
```

## Cached reads

```ts
export async function getThingsCached(page: number) {
  "use cache: remote";
  cacheTag("things-list");
  cacheLife({ expire: 60 });
  return createThingsModule().getThings(page);
}
```

Pass `"cached" | "not_cached"` from `queries.ts` — mirror existing dashboard feature pattern.

## Write flow

1. Add usecase → wire service → controller → `db/api-modules/<domain>.module.ts`
2. Add `createThingsAction()` in `app/actions.ts` with auth guard
3. Add `app/dashboard/<feature>/actions.ts` with `"use server"`, validation, `revalidatePath`
4. Call from client organism via `useTransition`

### Mutation action shape

```ts
"use server";

export async function createThingAction(
  input: ThingInput,
): Promise<{ success: boolean; message: string }> {
  // 1. normalize + validate
  // 2. const controller = await createThingsAction();
  // 3. await controller.createThing(...)
  // 4. revalidatePath("/dashboard/things");
  // 5. return { success: true, message: "..." };
}
```

## Backend wiring

```ts
// db/api-modules/things.module.ts
export function createThingsModule(): ThingsController {
  return new ThingsController(
    new ThingsService(new GetThingsUsecase(), new CreateThingUsecase()),
  );
}

// app/actions.ts
export async function createThingsAction(): Promise<ThingsController> {
  await requireDashboardAccess();
  return createThingsModule();
}
```

## Auth guards

| Function | Redirects |
| -------- | --------- |
| `requireDashboardAccess()` | `/login` or `/unauthorized` |
| `requireOwnerAccess()` | `/login` or `/unauthorized` (non-owner) |

Route matcher in `proxy.ts`: `["/dashboard/:path*", "/login"]`

## REST (rare)

```ts
export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await createThingsModule().getThings(1));
}
```

## Naming

| Artifact | Pattern |
| -------- | ------- |
| Usecase file | `<verb>_<entity>.usecase.ts` |
| Usecase class | `<Verb><Entity>Usecase` |
| Module | `create<Domain>Module()` |
| Action factory | `create<Domain>Action()` in `app/actions.ts` |
| Mutation | `<verb><Entity>Action()` |
| Query | `get<Entities>()` |
| Cache tag | kebab-case string |

## Component tiers

| Tier | When |
| ---- | ---- |
| `ui/` | shadcn / primitives |
| `molecules/` | Reusable small UI (stat card, sign-in button) |
| `organisms/` | Full dashboard sections with data + interaction |

## New feature checklist

- [ ] Types in `lib/types/`
- [ ] `db/usecase/` → service → controller → `api-modules/`
- [ ] `createXAction()` in `app/actions.ts`
- [ ] `page.tsx`, `queries.ts`, `actions.ts` (+ optional `cached-actions.ts`)
- [ ] Organism in `components/organisms/` if interactive
- [ ] `revalidatePath` after writes
- [ ] Nav in `admin-shell.tsx` if new section

## DB schema changes

1. Edit `drizzle/schema.ts`
2. `bunx drizzle-kit push` (or team migration workflow)
3. New queries → new usecase (not inline in page)

## Environment variables

| Variable | Required | Notes |
| -------- | -------- | ----- |
| `DATABASE_URL` | Yes | `mysql://user:pass@host:port/db` |
| `AUTH_SECRET` | Yes | `openssl rand -hex 32` |
| `AUTH_URL` | Prod | Public origin |
| `AUTH_GOOGLE_ID` | No | GIS Client ID; omit = no Google button |
| `AUTH_GOOGLE_SECRET` | No | Unused in GIS ID-token flow |
| `APP_ENV` | No | Dashboard badge: LOCAL / STAGING / PROD |

Copy `.env.example` → `.env` for local setup.

## Next.js 16 specifics

1. `searchParams` and `params` are Promises — always await.
2. `proxy.ts` for auth routing (this project).
3. `"use cache: remote"` + `cacheTag` / `cacheLife`.
4. `cacheComponents: true` in `next.config.ts`.
5. Read `node_modules/next/dist/docs/` before assuming older Next.js APIs.

## Commands

```bash
bun dev
bun run seed:createSuperAdmin -- "<password>"
bunx drizzle-kit push
bun run lint && bun run build
```
