# syntax=docker/dockerfile:1
# Same pattern as web/pay-ui (Cloud Run, Nitro server)

# ---- Dependencies ----
FROM node:24-slim AS deps
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# postinstall runs `nuxt prepare`, which needs the sources, so skip scripts here
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ---- Build ----
FROM deps AS build
COPY . .
RUN pnpm exec nuxt prepare
# `nuxt build` produces the self-contained Nitro server in .output
RUN pnpm exec nuxt build

# ---- Runtime ----
FROM gcr.io/distroless/nodejs24-debian13:nonroot AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8080
COPY --from=build --chown=nonroot:nonroot /app/.output ./

EXPOSE 8080
# The distroless image entrypoint is already `node`
CMD ["--enable-source-maps", "server/index.mjs"]
