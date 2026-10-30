# 24.22.1 at least: older Node 24 releases carry a Brotli decoder flaw that the Debian `nodejs`
# package has not fixed, so the base is the official Node image.
FROM node:24.22.1-trixie-slim AS build
WORKDIR /grimoire/app
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
RUN npm run build && npm prune --omit=dev

FROM node:24.22.1-trixie-slim
RUN apt-get update \
	&& apt-get install --yes --no-install-recommends git ca-certificates \
	&& rm -rf /var/lib/apt/lists/* \
	&& mkdir /data && chown node:node /data
WORKDIR /grimoire
COPY --from=build /grimoire/app/package.json app/
COPY --from=build /grimoire/app/node_modules app/node_modules
COPY --from=build /grimoire/app/build app/build
# Plain node runs these from source: the reset script, and the child process that indexes a source
# (found through `#lib` in package.json). They use only `node:` modules and node_modules.
COPY scripts/reset-admin.ts scripts/
COPY app/src/lib/server app/src/lib/server
USER node
ENV DATABASE_PATH=/data/grimoire.db
EXPOSE 3000
CMD ["node", "app/build"]
