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
{{#expo}}
- **Expo** with **React Native** and **Expo Router** (file-based routes in `{{appDir}}/`)
- **TanStack Query** for server state, refetching when the app returns to the foreground
- **StyleSheet** with brand tokens from `constants/tokens.ts`; colours come from `useColors()`
- **lucide-react-native** (on `react-native-svg`) for icons
{{/expo}}
{{#web}}
- **Tailwind CSS v4** with shadcn/ui primitives; every colour is a CSS variable
- **lucide-react** for icons, **clsx** + **tailwind-merge** via `cn()`
{{/web}}
- **{{pm}}**, always

## 2. Commands

| Task | Command |
| --- | --- |
{{#web}}
| Dev server | `{{run}} dev` |
| Build | `{{run}} build` |
{{/web}}
{{#expo}}
| Dev server | `{{run}} start` (then `i` for iOS, `a` for Android, `w` for web) |
| Add a native package | `{{exec}} expo install <package>` |
| Check SDK versions | `{{exec}} expo install --check` |
{{/expo}}
| Types | `{{run}} typecheck` |
| Lint | `{{run}} lint` |
| Format | `{{run}} format` |
{{#tanstack}}
| Regenerate routes | `{{run}} generate-routes` |
{{/tanstack}}

Every change passes `typecheck`, `lint` and `format` before it is done.

## 3. File & code conventions (required)

- **Kebab-case, lowercase file names**: `menu-item-row.tsx`, `format-price.ts`, `http-client.ts`.
- **Domain suffixes on data hooks**: `menu.query.ts` for reads, `orders.mutation.ts` for writes.
- **One component per file.** Sub-components get their own file. Behavioural hooks are one per file (`use-scrolled.ts`).
- **Comments are two lines at most** and explain why, not what. Hooks and services get a short doc header with a one-line purpose and `@author`.
- **`#/` imports only** (`import { httpClient } from '#/lib/http-client'`). No relative paths that climb (`../`).
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
{{#expo}}
├── app/           screens (Expo Router); _layout.tsx is the root
{{/expo}}
├── components/
│   ├── common/    shared across screens (icon.tsx lives here)
│   ├── layout/    {{#web}}header, footer, app shell{{/web}}{{#native}}screen wrappers, headers, tab bars{{/native}}
│   ├── ui/        {{#web}}shadcn primitives{{/web}}{{#native}}buttons, inputs and other primitives{{/native}}
│   └── <page>/    page-specific components{{#example}}, e.g. menu/{{/example}}
├── content/       static page copy, typed
├── data/          dynamic records, typed, with accessor functions
├── hooks/
│   ├── queries/   reads, grouped by domain
│   └── mutations/ writes, grouped by domain
├── lib/           {{#web}}utils, errors, http-client, seo{{/web}}{{#native}}errors, http-client{{/native}}
├── stores/        client state slices
├── constants/     {{#web}}cache times, site identity, env, feature flags{{/web}}{{#native}}cache times, env, feature flags, tokens{{/native}}
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
{{#expo}}
- `integrations/tanstack-query/query-client.ts` holds the single `QueryClient`.
- `integrations/tanstack-query/query-provider.tsx` is the **only** `QueryClientProvider`. It wraps the root navigator in `app/_layout.tsx`. Don't add another.
- The provider tells TanStack Query when the app is foregrounded (`AppState` → `focusManager`), so stale data refetches on return.
- Screens call query hooks directly and render their own loading, empty and error states; there is no server prefetch.
{{/expo}}

## 6. Data & content — the CMS-ready seam

- `types/index.ts` first: write the interfaces before building a {{#web}}page{{/web}}{{#native}}screen{{/native}}.
- `content/<page>.ts`: plain serialisable values only (no JSX, functions or imported components). Icons are string keys mapped in `components/common/icon.tsx`. Every record has a stable `id` or `slug`; ordered lists carry `order`.
- `data/<domain>.ts`: typed arrays with small accessors (`getOrders`, `getOrderBySlug`).
- Components **never** import from `data/`. They go through a hook in `hooks/queries/` or `hooks/mutations/`, which wraps the fetcher in `withErrorHandling`. Going live means changing the fetcher body to `httpClient`.

{{#example}}
Worked example (copy it for every new domain, then delete it):

1. `types/index.ts` → `MenuItem`, `MenuContent`
2. `data/menu.ts` → `getMenu()`
3. `hooks/queries/menu.query.ts` → `menuKeys`, `menuQueryOptions`, `useMenuQuery`
{{#next}}
4. `app/menu/page.tsx` → `seo()` metadata, and `components/menu/menu-section.tsx` → server prefetch behind `<Suspense>`
{{/next}}
{{#tanstack}}
4. `routes/menu.tsx` → `loader` + `head: () => seo(...)`
{{/tanstack}}
{{#expo}}
4. `app/menu.tsx` → the screen
{{/expo}}
5. `components/menu/menu-list.tsx` → loading, empty and error states
{{/example}}
{{^example}}
Every new domain follows the same five steps:

1. `types/index.ts` → `Order`, `OrdersContent`
2. `data/orders.ts` → `getOrders()`
3. `hooks/queries/orders.query.ts` → `orderKeys`, `ordersQueryOptions`, `useOrdersQuery` (wrap the fetcher in `withErrorHandling`)
{{#next}}
4. `app/orders/page.tsx` → server prefetch + `seo()` metadata
{{/next}}
{{#tanstack}}
4. `routes/orders.tsx` → `loader` + `head: () => seo(...)`
{{/tanstack}}
{{#expo}}
4. `app/orders.tsx` → the screen
{{/expo}}
5. `components/orders/orders-list.tsx` → loading, empty and error states
{{/example}}

## 7. Styling & design

{{#web}}
- Brand tokens are CSS variables mapped onto shadcn names in the main stylesheet (`--primary`, `--muted`, `--border`…).
- Components use `bg-primary`, `text-muted-foreground`, `border-border`. **Never a hex value in a component.**
- Load fonts once and give them roles (display, body).
- Add primitives as needed: `{{exec}} shadcn@latest add button dialog`.
{{/web}}
{{#native}}
- Brand tokens live in `constants/tokens.ts`: a light and dark `palette`, plus `spacing` and `radius` scales.
- Components get colours from `useColors()` and sizes from `spacing` / `radius`. **Never a hex value or magic number in a component.**
- Styles go in a `StyleSheet.create` block at the bottom of the file; only theme colours are applied inline.
- Load fonts once with `expo-font` and give them roles (display, body).
{{/native}}

{{#web}}
## 8. SEO (required on every page)

{{#next}}
Every page exports `metadata = seo({ title, description, path })` from `#/lib/seo`. Titles and descriptions come from `content/`.
{{/next}}
{{#tanstack}}
Every route sets `head: () => seo({ title, description, path })` from `#/lib/seo`. Titles and descriptions come from `content/`.
{{/tanstack}}
Site-wide defaults live in `constants/site.ts`.
{{/web}}
{{#native}}
## 8. Accessibility (required on every screen)

Every touchable has an `accessibilityRole` and a label. Loading states use `accessibilityRole="progressbar"` and errors use `"alert"`. Decorative icons are hidden from screen readers.
{{/native}}

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

- [ ] `{{run}} typecheck` and `{{run}} lint` pass
{{#web}}
- [ ] Renders correctly on mobile and desktop
{{/web}}
{{#native}}
- [ ] Runs on iOS and Android, in light and dark mode
{{/native}}
- [ ] Kebab-case files, one component per file, comments ≤ 2 lines
- [ ] Data flows through a hook + `data/` accessor
- [ ] No hardcoded copy or data in components
{{#web}}
- [ ] The page sets `seo()` metadata
{{/web}}
{{#native}}
- [ ] Touchables have roles and labels
{{/native}}
- [ ] Loading, empty and error states handled
