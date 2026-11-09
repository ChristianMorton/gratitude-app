# syntax=docker/dockerfile:1

# ─── deps ─────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts/copy-map-worker.mjs ./scripts/copy-map-worker.mjs
# npm 11 gates install scripts; package.json's allowScripts covers sharp — which
# is the only one that still needs to build. There is no prisma generate any
# more, so no schema has to be present here.
RUN npm ci

# ─── build ────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
COPY --from=deps /app/public/maplibre ./public/maplibre
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* are inlined into the client bundle at BUILD time, not read from
# the environment at runtime — so they have to be here, not only in compose. The
# publishable key is meant to be public; it is in the browser either way, and RLS
# is what protects the data. The secret key is deliberately absent: it is
# server-only and read at runtime, and baking it into a bundle would hand every
# visitor a key that bypasses RLS.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
RUN npm run build

# ─── runner ───────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# sharp, from the musl install — AFTER the standalone copy, so it overwrites what
# tracing produced. Tracing copies @img/sharp-libvips-*/lib/index.js but not the
# libvips-cpp.so next to it, which fails at runtime with ERR_DLOPEN_FAILED the
# first time anyone uploads a photo. That would take EXIF stripping down with it —
# and EXIF stripping is the reason photos go through this server at all instead of
# straight from the browser to Storage.
COPY --from=deps /app/node_modules/@img ./node_modules/@img
COPY --from=deps /app/node_modules/sharp ./node_modules/sharp

# No uploads directory any more: processed photos go to the private Supabase
# Storage bucket. Nothing is written to this filesystem.

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
