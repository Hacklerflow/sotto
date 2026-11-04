# Sotto

*sotto voce* — anonymous group surveys with cryptographic anonymity guarantees.

Participants are invited by e-mail, can answer exactly once, and nobody (not even the operator) can link an answer to a person. Results are only released once enough people have answered.

## Tech stack

SvelteKit 3 (Svelte 5, runes), TypeScript strict, Drizzle ORM, PostgreSQL (two databases), RSA blind signatures (RFC 9474, `@cloudflare/blindrsa-ts`), ECharts, Vitest.

## Setup

```bash
export IDENTITY_DB_PASSWORD=<choose-a-strong-password>
export ANSWER_DB_PASSWORD=<choose-a-different-strong-password>
docker compose up -d      # web app + identity database + answer database
```

The app is then served through the bundled Caddy reverse proxy (see `Caddyfile` and `docker-compose.yml`).

Local development and tests:

```bash
npm install
npm run dev
npm test                  # needs the two databases from docker compose
```

The test setup defaults to `postgres://sotto:sotto-dev@localhost:5433/sotto_identity` and `.../localhost:5434/sotto_answer`; override with `IDENTITY_DB_URL` and `ANSWER_DB_URL`.

## Architecture

- **Dual database.** The *identity DB* holds users, invitations, sessions, signing keys and signing grants. The *answer DB* holds surveys, public keys, responses and used-signature hashes. There are no foreign keys across the two, and the answer tables carry no timestamps, user references or ordering columns.
- **Blind signatures.** After redeeming an invitation the browser blinds a random message, the server signs it blindly (once per user and survey), and the browser unblinds the signature. The answer is submitted without a session cookie, after a random delay, together with the unblinded signature. The server can verify the signature but cannot connect it to the signing request.
- **Threshold and binning.** Results are available only after a minimum number of responses; rare answer combinations are suppressed or binned before aggregation. Frozen snapshots are what the results page shows.
- **Transparency.** `/trust` explains the guarantees in plain language, `/trust/expert` in technical detail.

## Contributing

Issues and pull requests are welcome. Use Conventional Commits, keep TypeScript strict (no `any`), and add tests for behaviour changes.

## License

Sotto is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only). If you run a modified version as a network service, you must offer its source code to its users.
