# 00 — Setup

Plans live in `docs/`, numbered in the order they're decided (`01-auth.md`, `02-checkout.md`…). Write the plan before the code for anything bigger than a feature. Keep each one short and specific.

## Goal

{{#hasDescription}}{{description}}{{/hasDescription}}{{^hasDescription}}<What this project is for, in two sentences.>{{/hasDescription}}

## Done so far

- [x] Project scaffolded with {{framework}} and {{pm}}
- [x] Folder structure, `{{importPrefix}}` alias, lint, format and typecheck scripts (cleanstart)
{{#example}}
{{#client}}
- [x] Example slice: menu type → data → query hook → {{#web}}page{{/web}}{{#native}}screen{{/native}} → component
{{/client}}
{{#server}}
- [x] Example slice: menu type → data → service → controller → {{#nest}}module{{/nest}}{{#express}}routes{{/express}} (`GET /menu`, `GET /menu/:slug`)
{{/server}}
{{/example}}
{{#web}}
- [ ] Check `constants/site.ts` (OG image, locale, Twitter handle)
- [ ] Fine-tune the brand tokens in the main stylesheet (primary is {{primary}})
{{/web}}
{{#native}}
- [ ] Set the app icon and splash screen in `app.json`
- [ ] Fine-tune the brand tokens in `constants/tokens.ts` (primary is {{primary}})
- [ ] Set `EXPO_PUBLIC_API_URL` in `.env` when the API is live
{{/native}}
{{#nest}}
- [x] Global `ValidationPipe` and `AllExceptionsFilter` in `main.ts`
- [ ] Run `{{run}} format` once so the new files match the project's Prettier style
- [ ] Add `@nestjs/config` (or keep `constants/env.ts`) once there are secrets to load
{{/nest}}
{{#express}}
- [x] `createApp()` in `app.ts` with JSON parsing, `/health`, a 404 and one error handler
- [ ] Load `.env` in development (`tsx watch --env-file=.env src/server.ts`) once there are secrets
{{/express}}
{{#server}}
- [ ] Pick the database and ORM, then swap the `data/` accessors for real queries inside the services
{{/server}}
{{#example}}
- [ ] Write the first real domain by copying the menu slice
- [ ] Delete the menu example once a real domain replaces it
{{/example}}
{{^example}}
{{#client}}
- [ ] Write the first real domain: type → data → query hook → {{#web}}page{{/web}}{{#native}}screen{{/native}} → component
{{/client}}
{{#server}}
- [ ] Write the first real domain in `modules/`: type → data → service → controller → {{#nest}}module{{/nest}}{{#express}}routes{{/express}}
{{/server}}
{{/example}}

## Decisions

| Decision | Why |
| --- | --- |
| | |

## Open questions

-
