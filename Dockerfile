# Build reproducibility: pinned Node major, lockfile install (npm ci), and the
# commit hash passed in as BUILD_HASH so /trust/expert can show what is running.
FROM node:22-alpine AS build
ARG BUILD_HASH=unknown
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN IDENTITY_DB_URL=build-placeholder ANSWER_DB_URL=build-placeholder npm run build && npm prune --omit=dev

FROM node:22-alpine
WORKDIR /app
ARG BUILD_HASH=unknown
ENV NODE_ENV=production PORT=3000 BUILD_HASH=$BUILD_HASH
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/drizzle ./drizzle
COPY docker-entrypoint.sh ./
USER node
EXPOSE 3000
CMD ["sh", "docker-entrypoint.sh"]
