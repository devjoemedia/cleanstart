# @devjoemedia/cleanstart

Add a clean, CMS-ready structure to a new **Next.js**, **TanStack Start** or **Expo (React Native)** app, or a **NestJS** or **Express** API, with one command.

```bash
npx @devjoemedia/cleanstart
```

Run it inside a freshly created project. It detects the framework, asks which package manager to use (the detected one is the default), picks the matching template, writes the files into the right folders, updates your config and installs what's needed. If it can't tell which framework the project uses, it asks you (or pass `--framework`).

Only the files your framework uses are added, and `CLAUDE.md` and `docs/00-setup.md` describe exactly what was installed. You don't have to rename or delete anything afterwards.

## What you get

### Front ends (Next.js, TanStack Start, Expo)

```
src/
├── components/
│   ├── common/icon.tsx            string key → icon (lucide-react on web, lucide-react-native on Expo)
│   └── layout/  ui/
├── content/  data/                typed page copy and mock records (empty, ready for your first domain)
├── hooks/queries/ mutations/
├── lib/                           errors, http-client (+ utils and seo on web)
├── constants/                     cache times, env, feature flags (+ site on web, tokens on native)
├── integrations/tanstack-query/   (Next.js, Expo) query client + provider
├── stores/
└── types/index.ts                 every shape in the app
CLAUDE.md                          house rules for you and your AI pair
docs/00-setup.md                   first numbered plan
.claude/launch.json                dev server config for Claude Code
```

It also:

- sets up the import alias: `@/` on Next.js and Expo (the alias they already ship with), `#/` on TanStack Start (in `tsconfig.json` and `package.json` imports)
- adds `typecheck`, `format` and `check` scripts, and turns on `noUnusedLocals` / `noUnusedParameters`
- **Next.js:** wraps `{children}` in the root layout with a single `QueryProvider`, adds brand tokens to `globals.css` and adds Prettier
- **TanStack Start:** uses the router's existing Query integration and adds brand tokens to `styles.css`
- **Expo:** wraps the navigator in `app/_layout.tsx` with a `QueryProvider` that refetches when the app returns to the foreground, adds a light/dark token palette with a `useColors()` hook, and adds Prettier
- installs what's missing: `@tanstack/react-query`, plus `clsx`, `tailwind-merge` and `lucide-react` on web, or `lucide-react-native` and `react-native-svg` on Expo (through `expo install`, so versions match your SDK)

### APIs (NestJS, Express)

```
src/
├── modules/<domain>/              feature modules (empty, ready for your first domain)
├── data/                          typed mock records behind the database seam
├── constants/                     env, feature flags
├── types/index.ts                 domain models and the one API error body
│
│   NestJS
├── common/filters/                all-exceptions.filter.ts: every error in the same JSON shape
│
│   Express
├── app.ts                         createApp(): JSON parsing, /health, routers, 404, error handler
├── server.ts                      listens on PORT
├── routes/index.ts                mounts every domain router
├── middleware/                    error-handler, not-found
└── lib/                           errors (AppError, NotFoundError, ValidationError), validate (zod)
CLAUDE.md                          house rules for you and your AI pair
docs/00-setup.md                   first numbered plan
.claude/launch.json                dev server config for Claude Code
```

It also:

- sets up the `@/` alias in `tsconfig.json` paths. Node can't read those at runtime, so the build rewrites them to relative paths: `nest build` does it on NestJS, and `tsc-alias` does it on Express
- writes imports with the `.js` extension in ESM projects (`"type": "module"`, the NestJS 12 default) and without it in CommonJS ones, so they resolve either way
- adds `typecheck`, `format` and `check` scripts, and turns on `noUnusedLocals` / `noUnusedParameters`
- **NestJS:** registers a global `ValidationPipe` (`whitelist`, `transform`) and `AllExceptionsFilter` in `src/main.ts`, and maps the alias for Jest on NestJS 11 and earlier (Vitest on NestJS 12 reads tsconfig paths itself). Installs `class-validator` and `class-transformer`
- **Express:** adds a `tsconfig.json` if there isn't one, `dev` (`tsx watch`), `build` (`tsc && tsc-alias`) and `start` scripts, a `.gitignore` and Prettier. Installs `zod`, plus `typescript`, `tsx`, `tsc-alias`, `@types/express` and `@types/node` as dev dependencies. It tells you what to move by hand if the project already has an `index.js` entry point, or if it's still on Express 4

Every error leaves the API with the same body, typed as `ApiError`:

```json
{ "error": { "status": 400, "message": "Validation failed", "details": ["category should not be empty"] } }
```

Server faults are logged in full but answered with a generic message, so stack traces never reach the client.

## Project details

When you run it at a terminal, cleanstart asks a few questions and writes the answers straight into the files, so there's nothing to find and replace afterwards:

```
  Project name (My App): Joe's Café
  Short description (optional): Fresh coffee in Accra.
  Site URL (https://www.example.com): joescafe.com
  Author (Joseph Nartey):
  Brand colour (#d2461a): #1e40af
  Add the menu example slice? (y/N): y
```

| Answer | Where it goes |
| --- | --- |
| Project name | `CLAUDE.md`, `constants/site.ts` (web), `app.json` name (Expo) |
| Description | `CLAUDE.md`, `docs/00-setup.md`, `constants/site.ts` (web) |
| Site URL | `constants/site.ts` (web only, not asked on Expo or the APIs) |
| Author | `@author` in file headers |
| Brand colour | `--primary` in the stylesheet (web) or the light and dark palette in `constants/tokens.ts` (Expo), with a readable foreground colour picked for you. Not asked on the APIs |

Before the details, it asks which package manager to use, with the one it detected (from the lockfile, or the one you ran `npx`/`pnpm dlx`/`bunx` with) as the default. Pick a different one and it reminds you to delete the old lockfile.

Press Enter to keep a default. Pass any answer as a flag to skip that question, or `--yes` to skip them all (handy in CI):

```bash
npx @devjoemedia/cleanstart --name "Joe's Café" --url joescafe.com --color 1e40af --yes
```

## The example slice

Pass `--example` to also add a menu example: one full vertical slice. Copy it for your first real domain, then delete it. Without the flag, nothing menu-related is added.

- **Front ends:** type → data → query hook → page or screen → component, with loading, empty and error states.
- **NestJS:** type → data → service → controller → module, with a `MenuQueryDto`, a service spec, and `MenuModule` added to `app.module.ts`.
- **Express:** type → data → service → controller → routes, with a zod schema, mounted at `/menu` in `routes/index.ts`.

On the APIs the slice serves `GET /menu`, `GET /menu?category=coffee` and `GET /menu/:slug`, with a 404 for an unknown slug and a 400 for bad input.

## Starting a new project

```bash
# Next.js
npx create-next-app@latest my-app --ts --tailwind --eslint --app --src-dir
cd my-app && npx @devjoemedia/cleanstart --framework next

# TanStack Start
npx @tanstack/cli@latest create my-app --add-ons tanstack-query --toolchain eslint
cd my-app && npx @devjoemedia/cleanstart --framework tanstack

# Expo (React Native)
npx create-expo-app@latest my-app
cd my-app && npx @devjoemedia/cleanstart --framework expo

# NestJS
npx @nestjs/cli@latest new my-api
cd my-api && npx @devjoemedia/cleanstart --framework nest

# Express
mkdir my-api && cd my-api && npm init -y && npm install express
npx @devjoemedia/cleanstart --framework express
```

On NestJS, run the `format` script once afterwards (`npm run format`, `yarn format`, …). Nest's Prettier config uses semicolons, and the new files are written without them.

`--framework` is optional when the project has a single framework, because cleanstart detects it. A NestJS project that also lists `express` is treated as NestJS. Passing it makes the command explicit and skips the prompt when detection is unclear. It also checks that the project really uses that framework, so running in the wrong folder fails with a clear message.

Add `--example` to any of these to include the menu example slice:

```bash
npx @devjoemedia/cleanstart --framework expo --example
```

Preview first without writing anything:

```bash
npx @devjoemedia/cleanstart --framework next --dry-run
```

## Options

| Flag | What it does |
| --- | --- |
| `--framework next\|tanstack\|expo\|nest\|express` | Skip detection |
| `--pm npm\|pnpm\|yarn\|bun` | Use this package manager instead of asking (the default is the one detected from the lockfile) |
| `--example` | Also add the menu example slice |
| `--name`, `--description`, `--url`, `--author`, `--color` | Answer a question up front (`--url` and `--color` are ignored on the APIs) |
| `-y`, `--yes` | Ask nothing; use flags and defaults |
| `--dry-run` | List what would change without writing anything |
| `--force` | Overwrite files that already exist (they're skipped by default) |
| `--no-install` | Don't install packages; prints what to install instead |
| `--cwd <dir>` | Run against another folder |

Running it twice is safe: existing files are skipped, and the tokens, provider, NestJS pipe, filter and module import, and `CLAUDE.md` rules are only added once. An existing `CLAUDE.md` keeps its content and gets the rules appended below it.

## Requirements

- Node 20+
- Next.js with the App Router, TanStack Start, or Expo with Expo Router (`app/` or `src/app/`)
- NestJS with its entry at `src/main.ts` (NestJS 12 ESM and NestJS 11 CommonJS both work)
- Express 5 (Express 4 works, but async errors need wrapping, and cleanstart tells you so). Plain JavaScript projects are fine, since cleanstart adds TypeScript
- Tailwind CSS v4 for the web token block (the rest works without it)

Based on [A clean project setup, step by step](https://devjoemedia.com/blog/clean-project-setup).

## License

MIT © Joseph Nartey
