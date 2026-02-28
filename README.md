# PlDyn Webapp

[![Release & Deploy](https://github.com/SkyeRangerDelta/PlDyn-Webapp/actions/workflows/app-ci.yml/badge.svg)](https://github.com/SkyeRangerDelta/PlDyn-Webapp/actions/workflows/app-ci.yml)
[![Latest Image](https://img.shields.io/github/v/release/SkyeRangerDelta/PlDyn-Webapp?include_prereleases&label=latest+image)](https://github.com/SkyeRangerDelta/PlDyn-Webapp/pkgs/container/pldyn-webapp)

Official webapp repository for Planetary Dynamics. It do be a website.

This thing runs on Deno 2 now. It's pretty cool. The backend is Oak + MongoDB with Jellyfin integration, and the frontend is Angular 21 with Angular Material.

---

## Stack

- **Backend**: Deno 2, Oak framework, MongoDB, Jellyfin
- **Frontend**: Angular 21, Angular Material

---

## Docker (Recommended)

### Setup

1. Copy `backend/.env.example` to `backend/.env` and fill in your values
2. `docker compose up --build`

That's pretty much it.

### Music Library Volume

The music library is a bind-mount. Set `MUSIC_LIBRARY_PATH` in your shell or in a `.env` file at the repo root to point at your music directory on the host. If you don't set it, it defaults to `./library/music`.

### Portainer Stacks

The `docker-compose.yml` is set up with Portainer in mind. If you're deploying via Portainer, set your environment variables directly in the stack editor. `APP_HOST` is automatically overridden to `0.0.0.0` inside the container so binding works correctly.

---

## Development

### Prerequisites

- Deno 2
- Node 22 + npm
- ffmpeg on PATH
- A running MongoDB instance (not included in the Docker compose)

### Running

All Deno tasks run from `backend/`:

```bash
deno task dev    # Backend API server with file watching
```

Angular commands run from `frontend/`:

```bash
npm run build    # Production build
npm start        # Dev server — proxies /api to localhost:3000
npm test         # Unit tests (headless Chrome)
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URI` | Yes | — | MongoDB connection string |
| `MONGO_DB_NAME` | Yes | — | Database name |
| `JELLYFIN_HOST` | No | `http://localhost:8096` | Jellyfin server URL |
| `APP_PORT` | No | `3000` | Server port |
| `APP_HOST` | No | `localhost` (dev) / `0.0.0.0` (Docker) | Bind address |
| `JWT_SECRET` | No | auto-generated | JWT signing secret |
| `MUSIC_LIBRARY_PATH` | No | `./library/music` | Host path for music library (Docker only) |

`JWT_SECRET` will be auto-generated and appended to `.env` on first run if you leave it unset. Feel free to set it yourself if you want a stable value across restarts.
