<!-- cleanstart -->
# CLAUDE.md — {{projectName}}

<Two sentences: what the product is and who it's for.> Core domains: <list>.

## 1. Stack

{{#next}}
- **Next.js** (App Router) with **React 19** and server components
- **TanStack Query** for server state: prefetched on the server, hydrated on the client
{{/next}}
{{#tanstack}}
- **TanStack Start** on **Vite** and **React 19**, with server rendering
- **TanStack Router** with file-based routes in `{{srcPath}}routes/`
- **TanStack Query** for server state, wired into SSR
{{/tanstack}}
- **Tailwind CSS v4** with shadcn/ui primitives; every colour is a CSS variable
- **lucide-react** for icons, **clsx** + **tailwind-merge** via `cn()`
- **{{pm}}**, always

## 2. Commands

| Task | Command |
| --- | --- |
| Dev server | `{{run}} dev` |
| Build | `{{run}} build` |
| Types | `{{exec}} tsc --noEmit` |
| Lint | `{{run}} lint` |
| Format | `{{run}} format` |
{{#tanstack}}
| Regenerate routes | `{{run}} generate-routes` |
{{/tanstack}}

Every change passes `tsc`, `lint` and `format` before it is done.

## 3. File & code conventions (required)

- **Kebab-case, lowercase file names**: `menu-item-row.tsx`, `format-price.ts`, `http-client.ts`.
- **Domain suffixes on data hooks**: `menu.query.ts` for reads, `orders.mutation.ts` for writes.
- **One component per file.** Sub-components get their own file. Behavioural hooks are one per file (`use-scrolled.ts`).
- **Comments are two lines at most** and explain why, not what. Hooks and services get a short doc header with a one-line purpose and `@author`.
- **`#/` imports only** (`import { cn } from '#/lib/utils'`). No relative paths that climb (`../`).
- **Nothing user-visible is hardcoded in a component.** Copy lives in `content/`, records in `data/`.
- Unused locals and parameters are type errors. Delete dead code; don't comment it out.

## 4. Folder structure

```
{{srcDir}}/
{{#next}}
├── app/           routes (App Router)
{{/next}}
{{#tanstack}}
├── routes/        file-based routes
{{/tanstack}}
├── components/
│   ├── common/    shared across pages (icon.tsx lives here)
│   ├── layout/    header, footer, app shell
│   ├── ui/        shadcn primitives
│   └── <page>/    page-specific components, e.g. menu/
├── content/       static page copy, typed
├── data/          dynamic records, typed, with accessor functions
├── hooks/
│   ├── queries/   reads, grouped by domain
│   └── mutations/ writes, grouped by domain
├── lib/           utils, errors, http-client, seo
├── stores/        client state slices
├── constants/     cache times, site identity, env, feature flags
├── integrations/  provider wiring
└── types/         domain models (index.ts is the single source of truth)
```

## 5. Providers & app wiring

{{#next}}
- `integrations/tanstack-query/get-query-client.ts` returns a new `QueryClient` per server request and one shared client in the browser.
- `integrations/tanstack-query/query-provider.tsx` is the **only** `QueryClientProvider`. It wraps `{children}` in the root layout. Don't add another.
- Pages prefetch with `getQueryClient().prefetchQuery(...)` and pass the cache down through `<HydrationBoundary state={dehydrate(queryClient)}>`.
- Components that call hooks are client components (`'use client'`). Keep pages as server components.
{{/next}}
{{#tanstack}}
- `integrations/tanstack-query/root-provider.tsx` creates the `QueryClient` in `getContext()`.
- `router.tsx` calls `setupRouterSsrQueryIntegration({ router, queryClient })`. This **already** wraps the app in `QueryClientProvider`. Never add a second one.
- `routes/__root.tsx` is the document shell: `<html>`, `<head>`, the site-wide SEO defaults, devtools and `<Scripts />`.
- Route loaders call `context.queryClient.ensureQueryData(...)` so pages server-render with data.
{{/tanstack}}

## 6. Data & content — the CMS-ready seam

- `types/index.ts` first: write the interfaces before building a page.
- `content/<page>.ts`: plain serialisable values only (no JSX, functions or imported components). Icons are string keys mapped in `components/common/icon.tsx`. Every record has a stable `id` or `slug`; ordered lists carry `order`.
- `data/<domain>.ts`: typed arrays with small accessors (`getMenu`, `getMenuItemBySlug`).
- Components **never** import from `data/`. They go through a hook in `hooks/queries/` or `hooks/mutations/`, which wraps the fetcher in `withErrorHandling`. Going live means changing the fetcher body to `httpClient`.

Worked example (copy it for every new domain):

1. `types/index.ts` → `MenuItem`, `MenuContent`
2. `data/menu.ts` → `getMenu()`
3. `hooks/queries/menu.query.ts` → `menuKeys`, `menuQueryOptions`, `useMenuQuery`
{{#next}}
4. `app/menu/page.tsx` → server prefetch + `seo()` metadata
{{/next}}
{{#tanstack}}
4. `routes/menu.tsx` → `loader` + `head: () => seo(...)`
{{/tanstack}}
5. `components/menu/menu-list.tsx` → loading, empty and error states

## 7. Styling & design

- Brand tokens are CSS variables mapped onto shadcn names in the main stylesheet (`--primary`, `--muted`, `--border`…).
- Components use `bg-primary`, `text-muted-foreground`, `border-border`. **Never a hex value in a component.**
- Load fonts once and give them roles (display, body).
- Add primitives as needed: `{{exec}} shadcn@latest add button dialog`.

## 8. SEO (required on every page)

{{#next}}
Every page exports `metadata = seo({ title, description, path })` from `#/lib/seo`. Titles and descriptions come from `content/`.
{{/next}}
{{#tanstack}}
Every route sets `head: () => seo({ title, description, path })` from `#/lib/seo`. Titles and descriptions come from `content/`.
{{/tanstack}}
Site-wide defaults live in `constants/site.ts`.

## 9. Skills

List the agent skills in `.claude/skills/` and when to use each one.

## 10. Authorship

Hooks and services carry a doc header:

```ts
/**
 * One-line purpose.
 * @author {{author}}
 */
```

## 11. Definition of done

- [ ] `{{exec}} tsc --noEmit` and `{{run}} lint` pass
- [ ] Renders correctly on mobile and desktop
- [ ] Kebab-case files, one component per file, comments ≤ 2 lines
- [ ] Data flows through a hook + `data/` accessor
- [ ] No hardcoded copy or data in components
- [ ] The page sets `seo()` metadata
- [ ] Loading, empty and error states handled
