# ── Stage 1: Build Angular frontend ──────────────────────────────────────────
FROM node:22-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci --ignore-scripts
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Deno runtime ────────────────────────────────────────────────────
FROM denoland/deno:debian
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend source
COPY backend/ ./

# Copy shared types needed by backend at the path its relative imports resolve to
RUN mkdir -p /frontend/src/app
COPY frontend/src/app/customTypes.ts /frontend/src/app/customTypes.ts

# Copy built Angular app to path backend expects at Deno.cwd()
COPY --from=frontend-builder /build/dist/webapp/browser ./frontend/dist/webapp/browser

# Pre-warm Deno module cache
RUN deno cache main.ts

# library/music and temp are populated at runtime (volume + cleanTempFolders)
RUN mkdir -p library/music temp/audio-uploads

EXPOSE 4200

CMD ["deno", "run", \
     "--allow-net", "--allow-read", "--allow-write", \
     "--allow-env", "--allow-sys", "--allow-run", \
     "main.ts"]
