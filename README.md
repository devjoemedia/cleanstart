# cleanstart

Add a clean, CMS-ready structure to a new **Next.js** or **TanStack Start** app with one command.

```bash
npx cleanstart
```

Run it inside a freshly created project. It detects the framework and package manager, writes the files into the right folders, updates your config and installs what's needed.

## What you get

```
src/
├── app/menu/ or routes/menu.tsx   example page, server-rendered with data
├── components/
│   ├── common/icon.tsx            string key → icon component
│   ├── layout/  ui/
│   └── menu/                      menu-list.tsx, menu-item-card.tsx
├── content/                       typed page copy (home.ts, menu.ts)
├── data/                          typed mock records + accessors
├── hooks/queries/ mutations/      menu.query.ts
├── lib/                           utils (cn), errors, http-client, seo
├── constants/                     cache times, site identity, env, feature flags
├── integrations/tanstack-query/   (Next.js) query client + provider
├── stores/
└── types/index.ts                 every shape in the app
CLAUDE.md                          house rules for you and your AI pair
docs/00-setup.md                   first numbered plan
.claude/launch.json                dev server config for Claude Code
```

It also:

- adds the `#/` import alias to `package.json` and `tsconfig.json`
- adds `typecheck`, `format` and `check` scripts, and turns on `noUnusedLocals` / `noUnusedParameters`
- appends brand tokens (`--primary`, `--muted`, `--border`…) to your main stylesheet, mapped for Tailwind v4
- **Next.js:** wraps `{children}` in the root layout with a single `QueryProvider`, and adds Prettier
- **TanStack Start:** uses the router's existing Query integration and regenerates the route tree
- installs `@tanstack/react-query`, `clsx`, `tailwind-merge` and `lucide-react` if they're missing

The menu example is one full vertical slice: **type → data → query hook → server prefetch or loader → component**, with loading, empty and error states. Copy it for your first real domain, then delete it.

## Starting a new project

```bash
# Next.js
npx create-next-app@latest my-app --ts --tailwind --eslint --app --src-dir
cd my-app && npx cleanstart

# TanStack Start
npx @tanstack/cli@latest create my-app --add-ons tanstack-query --toolchain eslint
cd my-app && npx cleanstart
```

## Options

| Flag | What it does |
| --- | --- |
| `--dry-run` | List what would change without writing anything |
| `--force` | Overwrite files that already exist (they're skipped by default) |
| `--no-install` | Don't install packages; prints what to install instead |
| `--framework next\|tanstack` | Skip detection |
| `--cwd <dir>` | Run against another folder |

Running it twice is safe: existing files are skipped, and the tokens, provider and `CLAUDE.md` rules are only added once. An existing `CLAUDE.md` keeps its content and gets the rules appended below it.

## Requirements

- Node 20+
- Next.js with the App Router, or TanStack Start
- Tailwind CSS v4 for the token block (the rest works without it)

Based on [A clean project setup, step by step](https://devjoemedia.com/blog/clean-project-setup).

## License

MIT © Joseph Nartey
