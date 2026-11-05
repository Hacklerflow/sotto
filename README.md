# Sotto

*sotto voce* — ehrliche Antworten, kryptografisch geschützt.

Sotto is an open-source platform for anonymous group surveys. Participants are invited by e-mail, can answer exactly once, and nobody — not even the operator — can link an answer to a person. Results are only released once enough people have answered.

## Security Model

Sotto does not rely on trust. It uses **Blind RSA Signatures** (RFC 9474, RSABSSA-SHA384-PSS-Deterministic) to mathematically separate identity from response:

1. A participant redeems their invitation — the server marks it as used.
2. The browser blinds a random token and sends it to the server.
3. The server signs the blinded token without seeing the original.
4. The browser unblinds the signature and submits the answer on a fresh connection — no session cookie, no referrer, no correlation.

Additional guarantees:

- **Dual databases.** Identities and answers live in two physically separate PostgreSQL instances with no foreign keys or shared connection.
- **k-Anonymity.** Results appear only after a minimum number of responses. Rare answer combinations are binned before aggregation.
- **Frozen snapshots.** Results are computed once and served as immutable snapshots.

See [`/trust`](src/routes/trust/+page.svelte) for the plain-language explanation and [`/trust/expert`](src/routes/trust/expert/+page.svelte) for the full technical architecture.

## Tech Stack

SvelteKit 3 (Svelte 5, runes), TypeScript strict, Drizzle ORM, 2× PostgreSQL, `@cloudflare/blindrsa-ts` v0.4.4, ECharts, Vitest.

## Quick Start

```bash
# Production (Docker Compose)
export IDENTITY_DB_PASSWORD=<choose-a-strong-password>
export ANSWER_DB_PASSWORD=<choose-a-different-strong-password>
docker compose up -d
```

The app is served through the bundled Caddy reverse proxy (see `Caddyfile` and `docker-compose.yml`).

```bash
# Local development
npm install
npm run dev
npm test    # needs the two databases from docker compose
```

The test setup defaults to `postgres://sotto:sotto-dev@localhost:5433/sotto_identity` and `.../localhost:5434/sotto_answer`; override with `IDENTITY_DB_URL` and `ANSWER_DB_URL`.

## Architecture

```
┌─────────────┐          ┌──────────────┐
│ Identity DB │          │  Answer DB   │
│  (port 5433)│          │ (port 5434)  │
│             │          │              │
│ invitations │          │ surveys      │
│ email hashes│   no FK  │ public keys  │
│ groups      │◄────────►│ responses    │
│ sessions    │          │ snapshots    │
└─────────────┘          └──────────────┘
```

- The **identity DB** knows who may participate. The **answer DB** knows what was answered.
- The only function that reads both is `getSurveyProgress()` — it returns counts, never associations.
- Answer tables carry no timestamps, user references, or ordering columns.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

Sotto is licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-only). If you run a modified version as a network service, you must offer its source code to its users.
