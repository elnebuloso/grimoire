# The official Node image, not Debian's `nodejs`, which lags behind on security fixes (it kept a
# Brotli decoder flaw fixed in Node 24.22.1). Node 24 rolling: every build takes its newest minor
# and patch release, so security fixes arrive without a change here.
FROM node:24-trixie-slim AS build
WORKDIR /grimoire/app
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
RUN npm run build && npm prune --omit=dev

FROM node:24-trixie-slim
# The upgrade takes Debian's security fixes released since the base image was built; Node's own
# fixes, such as the bundled Brotli decoder's, come with the base image above.
RUN apt-get update \
	&& apt-get upgrade --yes \
	&& apt-get install --yes --no-install-recommends git ca-certificates tini \
	&& rm -rf /var/lib/apt/lists/* \
	&& mkdir /data && chown node:node /data
WORKDIR /grimoire
COPY --from=build /grimoire/app/package.json app/
COPY --from=build /grimoire/app/node_modules app/node_modules
COPY --from=build /grimoire/app/build app/build
# Plain node runs these from source: the grant-admin, backup and import scripts, and the child
# process that indexes a source (found through `#lib` in package.json). They use only `node:`
# modules and node_modules.
COPY scripts/grant-admin.ts scripts/backup.ts scripts/import.ts scripts/prompt.ts scripts/
COPY app/src/lib/server app/src/lib/server
USER node
# The release passes the version it tags; a local `make image` builds 0.0.0.
ARG GRIMOIRE_VERSION=0.0.0
ENV GRIMOIRE_VERSION=$GRIMOIRE_VERSION
ENV DATABASE_PATH=/data/grimoire.db
EXPOSE 3000
# tini as process 1 reaps the orphans the indexing deadline leaves when it kills a process group;
# Node does not, and each would stay a zombie for the life of the container.
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "app/build"]
