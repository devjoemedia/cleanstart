# @devjoemedia/cleanstart

Add a clean, CMS-ready structure to a new **Next.js**, **TanStack Start** or **Expo (React Native)** app with one command.

```bash
npx @devjoemedia/cleanstart
```

Run it inside a freshly created project. It detects the framework and package manager, picks the matching template, writes the files into the right folders, updates your config and installs what's needed. If it can't tell which framework the project uses, it asks you (or pass `--framework`).

Only the files your framework uses are added, and `CLAUDE.md` and `docs/00-setup.md` describe exactly what was installed. You don't have to rename or delete anything afterwards.

## What you get

```
src/
├── components/
│   ├── common/icon.tsx            string key → icon (lucide on web, Ionicons on native)
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

- adds the `#/` import alias to `tsconfig.json` (and to `package.json` imports on web)
- adds `typecheck`, `format` and `check` scripts, and turns on `noUnusedLocals` / `noUnusedParameters`
- **Next.js:** wraps `{children}` in the root layout with a single `QueryProvider`, adds brand tokens to `globals.css` and adds Prettier
- **TanStack Start:** uses the router's existing Query integration and adds brand tokens to `styles.css`
- **Expo:** wraps the navigator in `app/_layout.tsx` with a `QueryProvider` that refetches when the app returns to the foreground, adds a light/dark token palette with a `useColors()` hook, and adds Prettier
- installs what's missing: `@tanstack/react-query`, plus `clsx`, `tailwind-merge` and `lucide-react` on web, or `@expo/vector-icons` on Expo (through `expo install`, so versions match your SDK)

## The example slice

Pass `--example` to also add a menu example: one full vertical slice, **type → data → query hook → page or screen → component**, with loading, empty and error states. Copy it for your first real domain, then delete it. Without the flag, nothing menu-related is added.

## Starting a new project

```bash
# Next.js
npx create-next-app@latest my-app --ts --tailwind --eslint --app --src-dir
cd my-app && npx @devjoemedia/cleanstart

# TanStack Start
npx @tanstack/cli@latest create my-app --add-ons tanstack-query --toolchain eslint
cd my-app && npx @devjoemedia/cleanstart

# Expo
npx create-expo-app@latest my-app
cd my-app && npx @devjoemedia/cleanstart
```

## Options

| Flag | What it does |
| --- | --- |
| `--framework next\|tanstack\|expo` | Skip detection |
| `--example` | Also add the menu example slice |
| `--dry-run` | List what would change without writing anything |
| `--force` | Overwrite files that already exist (they're skipped by default) |
| `--no-install` | Don't install packages; prints what to install instead |
| `--cwd <dir>` | Run against another folder |

Running it twice is safe: existing files are skipped, and the tokens, provider and `CLAUDE.md` rules are only added once. An existing `CLAUDE.md` keeps its content and gets the rules appended below it.

## Requirements

- Node 20+
- Next.js with the App Router, TanStack Start, or Expo with Expo Router (`app/` or `src/app/`)
- Tailwind CSS v4 for the web token block (the rest works without it)

Based on [A clean project setup, step by step](https://devjoemedia.com/blog/clean-project-setup).

## License

MIT © Joseph Nartey
