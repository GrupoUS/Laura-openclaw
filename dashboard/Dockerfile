FROM oven/bun:latest AS builder

WORKDIR /app

# Install dependencies first (caching)
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy the rest of the source code
COPY . .

# Pass VITE_* env vars as build args (Vite embeds them at build time)
ARG VITE_SSE_READ_TOKEN
ENV VITE_SSE_READ_TOKEN=${VITE_SSE_READ_TOKEN}

# Build using the project's build script (snapshot + vite + server + data copy)
RUN bun run build

# Runner Stage
FROM oven/bun:latest AS runner
WORKDIR /app

# Copy built assets
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./bun.lock* ./

# Keep it lean with production dependencies only
RUN bun install --production --frozen-lockfile

EXPOSE 3000

ENV NODE_ENV=production
CMD ["bun", "dist/server/index.js"]
