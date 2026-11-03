#!/bin/sh
set -e
node drizzle/identity-migrate.ts
node drizzle/answer-migrate.ts
exec node build
