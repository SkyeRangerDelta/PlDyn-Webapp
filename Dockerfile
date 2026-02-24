# ── Stage 1: Build Angular frontend ──────────────────────────────────────────
FROM node:22-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci --ignore-scripts
COPY frontend/ ./
RUN npm run build

# ── Stage 2: Deno runtime ────────────────────────────────────────────────────
FROM denoland/deno:alpine
RUN apk add --no-cache ffmpeg

WORKDIR /app

# Copy backend source
COPY backend/ ./

# Copy built Angular app to path backend expects at Deno.cwd()
COPY --from=frontend-builder /build/dist/webapp/browser ./frontend/dist/frontend/browser

# Pre-warm Deno module cache
RUN deno cache main.ts

# library/music and temp are populated at runtime (volume + cleanTempFolders)
RUN mkdir -p library/music temp/audio-uploads

EXPOSE 4200

CMD ["deno", "run", \
     "--allow-net", "--allow-read", "--allow-write", \
     "--allow-env", "--allow-sys", "--allow-run", \
     "main.ts"]
