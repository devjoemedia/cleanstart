# 00 — Setup

Plans live in `docs/`, numbered in the order they're decided (`01-auth.md`, `02-checkout.md`…). Write the plan before the code for anything bigger than a feature. Keep each one short and specific.

## Goal

<What this project is for, in two sentences.>

## Done so far

- [x] Project scaffolded with {{framework}} and {{pm}}
- [x] Folder structure, `#/` alias, lint, format and typecheck scripts (cleanstart)
{{#example}}
- [x] Example slice: menu type → data → query hook → {{#web}}page{{/web}}{{#native}}screen{{/native}} → component
{{/example}}
{{#web}}
- [ ] Fill in `constants/site.ts` (name, URL, description, OG image)
- [ ] Replace the brand tokens in the main stylesheet with the real palette
{{/web}}
{{#native}}
- [ ] Set the app name, icon and splash screen in `app.json`
- [ ] Replace the brand tokens in `constants/tokens.ts` with the real palette
- [ ] Set `EXPO_PUBLIC_API_URL` in `.env` when the API is live
{{/native}}
{{#example}}
- [ ] Write the first real domain by copying the menu slice
- [ ] Delete the menu example once a real domain replaces it
{{/example}}
{{^example}}
- [ ] Write the first real domain: type → data → query hook → {{#web}}page{{/web}}{{#native}}screen{{/native}} → component
{{/example}}

## Decisions

| Decision | Why |
| --- | --- |
| | |

## Open questions

-
