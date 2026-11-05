# Contributing to Sotto

Thanks for your interest in making anonymous surveys better.

## Getting started

```bash
docker compose up -d          # starts identity-db + answer-db
npm install
npm run dev                   # SvelteKit dev server
npm test                      # Vitest (needs running databases)
```

The dev databases default to `localhost:5433` (identity) and `localhost:5434` (answer). Override with `IDENTITY_DB_URL` and `ANSWER_DB_URL`.

## Code style

- **TypeScript strict** — no `any`, no `@ts-ignore`.
- **Svelte 5 runes** — use `$state`, `$derived`, `$effect`.
- **Conventional Commits** — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, etc.
- **No comments unless the why is non-obvious.** Good names over documentation.
- Lint with `npx svelte-check --threshold error` before submitting.

## Pull requests

1. One concern per PR.
2. Add or update tests for behaviour changes.
3. Keep PRs small — easier to review, easier to revert.

## Security

If you find a security vulnerability, please report it privately instead of opening a public issue. The cryptographic guarantees (blind signatures, database separation, k-anonymity) are core to the project — changes that weaken them will not be merged.

## License

By contributing you agree that your contributions will be licensed under the [AGPL-3.0-only](LICENSE) license.
