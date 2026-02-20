FROM oven/bun:latest AS builder

WORKDIR /app

# Install dependencies first (caching)
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Build Vite frontend and Bun backend
RUN bun vite build
# Build the hono backend into a single executable file or just transpile.
# For simplicity and to ensure file serving works paths cleanly, we just tsc and run with bun directly.
# Let's use `bun build` to bundle the server, although it's fine to just run index.ts
RUN bun build src/server/index.ts --outdir dist/server --target bun

# Runner Stage
FROM oven/bun:latest AS runner
WORKDIR /app

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./bun.lockb* ./

# Keep it lean with production dependencies only
RUN bun install --production --frozen-lockfile

EXPOSE 3000

ENV NODE_ENV=production
CMD ["bun", "dist/server/index.js"]
