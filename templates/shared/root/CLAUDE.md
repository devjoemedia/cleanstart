<!-- cleanstart -->
# CLAUDE.md — {{projectName}}

{{#hasDescription}}{{description}}{{/hasDescription}}{{^hasDescription}}<Two sentences: what the product is and who it's for.>{{/hasDescription}} Core domains: <list>.

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
{{#nest}}
- **NestJS** on **Node** and **Express**, with TypeScript
- **Feature modules** in `{{srcPath}}modules/`: each has a module, a controller and a service
- **class-validator** DTOs, checked by a global `ValidationPipe`
- One global `AllExceptionsFilter`, so every error has the same JSON body
{{/nest}}
{{#express}}
- **Express 5** on **Node**, with TypeScript (`tsx` in development, `tsc` + `tsc-alias` for the build)
- **Feature modules** in `{{srcPath}}modules/`: routes → controller → service
- **zod** schemas validate request input through `parse()` in `lib/validate.ts`
- One error-handling middleware, so every error has the same JSON body
{{/express}}
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
{{#nest}}
| Dev server | `{{run}} start:dev` (http://localhost:3000) |
| Build | `{{run}} build` |
| Tests | `{{run}} test` (unit), `{{run}} test:e2e` (end to end) |
| New feature module | `{{exec}} nest g resource modules/<domain>` |
{{/nest}}
{{#express}}
| Dev server | `{{run}} dev` (http://localhost:3000, restarts on save) |
| Build | `{{run}} build` (compiles to `dist/`) |
| Run the build | `{{run}} start` |
{{/express}}
| Types | `{{run}} typecheck` |
{{#hasLint}}
| Lint | `{{run}} lint` |
{{/hasLint}}
| Format | `{{run}} format` |
{{#tanstack}}
| Regenerate routes | `{{run}} generate-routes` |
{{/tanstack}}

Every change passes `typecheck`{{#hasLint}}, `lint`{{/hasLint}} and `format`{{#nest}} (plus `test`){{/nest}} before it is done.

## 3. File & code conventions (required)

{{#client}}
- **Kebab-case, lowercase file names**: `menu-item-row.tsx`, `format-price.ts`, `http-client.ts`.
- **Domain suffixes on data hooks**: `menu.query.ts` for reads, `orders.mutation.ts` for writes.
- **One component per file.** Sub-components get their own file. Behavioural hooks are one per file (`use-scrolled.ts`).
{{/client}}
{{#server}}
- **Kebab-case, lowercase file names**: `order-item.ts`, `error-handler.ts`.
{{#nest}}
- **Role suffixes inside a module**: `orders.module.ts`, `orders.controller.ts`, `orders.service.ts`, `dto/create-order.dto.ts`.
{{/nest}}
{{#express}}
- **Role suffixes inside a module**: `orders.routes.ts`, `orders.controller.ts`, `orders.service.ts`, `orders.schema.ts`.
{{/express}}
- **One class or router per file.** Controllers stay thin: read the request, call the service, return the result.
{{/server}}
- **Comments are two lines at most** and explain why, not what. Hooks and services get a short doc header with a one-line purpose and `@author`.
{{#client}}
- **`#/` imports only** (`import { httpClient } from '#/lib/http-client'`). No relative paths that climb (`../`).
- **Nothing user-visible is hardcoded in a component.** Copy lives in `content/`, records in `data/`.
{{/client}}
{{#server}}
- **`#/` imports only**{{#esm}}, with the `.js` extension Node's ESM loader needs{{/esm}} (`import { menuService } from '#/modules/menu/menu.service{{ext}}'`). {{#nest}}`nest build`{{/nest}}{{#express}}`tsc-alias`{{/express}} rewrites the alias to relative paths in `dist/`. No relative paths that climb (`../`).
- **Controllers never import from `data/`.** They call a service, and only services touch `data/` (later, the database).
{{/server}}
- Unused locals and parameters are type errors. Delete dead code; don't comment it out.

## 4. Folder structure

{{#client}}
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
{{/client}}
{{#server}}
```
{{srcDir}}/
{{#nest}}
├── main.ts        bootstrap: global ValidationPipe and AllExceptionsFilter, then listen
├── app.module.ts  root module; imports every feature module
├── common/
│   └── filters/   all-exceptions.filter.ts (the one error shape)
{{/nest}}
{{#express}}
├── server.ts      starts listening; nothing else
├── app.ts         createApp(): middleware, routers, 404 and error handler, in that order
├── routes/        index.ts mounts every domain router
├── middleware/    error-handler.ts, not-found.ts
{{/express}}
├── modules/
│   └── <domain>/  {{#nest}}module, controller, service, dto/{{/nest}}{{#express}}routes, controller, service, schema{{/express}}{{#example}}, e.g. menu/{{/example}}
├── data/          mock records, typed, with accessor functions (the database seam)
├── lib/           {{#nest}}shared helpers{{/nest}}{{#express}}errors, validate{{/express}}
├── constants/     env, feature flags
└── types/         domain models and the API error body (index.ts is the single source of truth)
```
{{/server}}

{{#client}}
## 5. Providers & app wiring
{{/client}}
{{#server}}
## 5. App wiring
{{/server}}

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
{{#nest}}
- `main.ts` registers `ValidationPipe({ whitelist: true, transform: true })` and `AllExceptionsFilter` globally. Don't add them per controller.
- Every feature module is listed in `imports` of `app.module.ts`. A module only exports the services other modules need.
- Services are `@Injectable()` and reach controllers through the constructor; never `new` a service by hand.
- `common/` holds cross-cutting pieces: filters, guards, interceptors, pipes.
{{/nest}}
{{#express}}
- `app.ts` builds the app without listening, so tests can mount `createApp()` with supertest.
- Order matters: `express.json()` → `/health` → `routes/index.ts` → `notFound` → `errorHandler`. The error handler is always last.
- Each domain exports one `Router` from `modules/<domain>/<domain>.routes.ts`, mounted in `routes/index.ts` under its own path.
- Express 5 sends a rejected promise to the error handler, so async controllers just `throw`. No try/catch for routing errors.
{{/express}}

{{#client}}
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
{{/client}}
{{#server}}
## 6. Data — the database-ready seam

- `types/index.ts` first: write the interfaces before building an endpoint.
- `data/<domain>.ts`: typed arrays with small accessors (`getOrders`, `getOrderBySlug`). Every record has a stable `id` or `slug`.
- Services are the only callers of `data/`, and their methods already return promises. Going live means changing a service body to a database or ORM call; controllers and routes don't change.
- Keep request and response shapes separate from storage: {{#nest}}DTOs in `dto/`{{/nest}}{{#express}}zod schemas in `<domain>.schema.ts`{{/express}} describe what comes in; `types/` describes what goes out.

{{#example}}
Worked example (copy it for every new domain, then delete it):

1. `types/index.ts` → `MenuItem`
2. `data/menu.ts` → `getMenu()`, `getMenuItemBySlug()`
{{#nest}}
3. `modules/menu/menu.service.ts` → `findAll()`, `findOne()` (throws `NotFoundException`)
4. `modules/menu/dto/menu-query.dto.ts` and `menu.controller.ts` → `GET /menu?category=`, `GET /menu/:slug`
5. `modules/menu/menu.module.ts`, imported in `app.module.ts`, with `menu.service.spec.ts` next to it
{{/nest}}
{{#express}}
3. `modules/menu/menu.service.ts` → `list()`, `getBySlug()` (throws `NotFoundError`)
4. `modules/menu/menu.schema.ts` and `menu.controller.ts` → `GET /menu?category=`, `GET /menu/:slug`
5. `modules/menu/menu.routes.ts`, mounted at `/menu` in `routes/index.ts`
{{/express}}
{{/example}}
{{^example}}
Every new domain follows the same five steps:

1. `types/index.ts` → `Order`
2. `data/orders.ts` → `getOrders()`, `getOrderBySlug()`
{{#nest}}
3. `modules/orders/orders.service.ts` → `findAll()`, `findOne()`
4. `modules/orders/dto/` and `orders.controller.ts` → the endpoints
5. `modules/orders/orders.module.ts`, added to `imports` in `app.module.ts`
{{/nest}}
{{#express}}
3. `modules/orders/orders.service.ts` → `list()`, `getBySlug()`
4. `modules/orders/orders.schema.ts` and `orders.controller.ts` → the endpoints
5. `modules/orders/orders.routes.ts`, mounted in `routes/index.ts`
{{/express}}
{{/example}}
{{/server}}

{{#client}}
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
{{/client}}
{{#server}}
## 7. Errors & validation

{{#nest}}
- Throw Nest's HTTP exceptions from services (`NotFoundException`, `ConflictException`…) with a message that is safe to show.
- Every input is a DTO class with class-validator decorators. `whitelist` strips unknown fields and `transform` gives you real class instances.
{{/nest}}
{{#express}}
- Throw the errors in `lib/errors.ts` (`NotFoundError`, `ValidationError`, or `AppError` with any status) with a message that is safe to show.
- Every input goes through `parse(schema, req.body | req.query | req.params)` before it is used. A failure is a 400 with one line per problem.
{{/express}}
- 5xx errors are logged in full and answered with a generic message; stack traces and internals never reach the client.

## 8. API responses (required on every endpoint)

- JSON in, JSON out. Successful responses return the resource or a list of them, never a wrapper.
- Errors always have the `ApiError` body from `types/index.ts`: `{ "error": { "status", "message", "details"? } }`.
- Status codes mean what they say: `201` on create, `204` on delete, `400` for bad input, `404` for a missing record.
- Paths are plural nouns per domain (`/orders`, `/orders/:id`); the verb is the HTTP method.
{{/server}}

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

- [ ] `{{run}} typecheck`{{#hasLint}} and `{{run}} lint`{{/hasLint}}{{#nest}} and `{{run}} test`{{/nest}} pass
{{#web}}
- [ ] Renders correctly on mobile and desktop
{{/web}}
{{#native}}
- [ ] Runs on iOS and Android, in light and dark mode
{{/native}}
{{#client}}
- [ ] Kebab-case files, one component per file, comments ≤ 2 lines
- [ ] Data flows through a hook + `data/` accessor
- [ ] No hardcoded copy or data in components
{{/client}}
{{#server}}
- [ ] Kebab-case files with role suffixes, comments ≤ 2 lines
- [ ] Data flows controller → service → `data/` accessor
- [ ] Every input is validated; errors use the `ApiError` body
- [ ] The endpoint is tried by hand (or with a test) for success, bad input and not found
{{/server}}
{{#web}}
- [ ] The page sets `seo()` metadata
{{/web}}
{{#native}}
- [ ] Touchables have roles and labels
{{/native}}
{{#client}}
- [ ] Loading, empty and error states handled
{{/client}}
