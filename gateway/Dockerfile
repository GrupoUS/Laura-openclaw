# OpenClaw Gateway — Railway Service
# Runs the WebSocket gateway that dashboard connects to

FROM node:22-slim

# Install git (required by openclaw npm deps)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Install openclaw globally
RUN npm install -g openclaw@latest

# Create app directory
WORKDIR /app

# Copy entrypoint script
COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3333

# Gateway config is injected via OPENCLAW_CONFIG env var (base64-encoded openclaw.json)
# or mounted as a volume at /app/openclaw.json
ENV NODE_ENV=production
ENV PORT=3333

CMD ["./entrypoint.sh"]
