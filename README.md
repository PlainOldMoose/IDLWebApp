# IDL WebApp

A full-stack web application for managing an **in-house Dota 2 league (IDL)**. Built to replace manual spreadsheet tracking with a proper platform for seasons, teams, matches, player ELO ratings, and Steam-authenticated signups.

## Why This Exists

Running an in-house Dota 2 league means juggling spreadsheets for player stats, match results, ELO calculations, and season standings. IDL WebApp centralises all of that into a single application where players can authenticate with Steam, sign up for seasons, and track their performance over time.

## Features

- **Seasons** - Admins create seasons; players sign up with their role preferences and whether they'd captain
- **Teams and standings** - Each season's teams, captains, win/loss records and average ELO
- **Matches** - Season and in-house results with Radiant/Dire sides and each player's ELO change
- **Players** - An ELO ladder, plus each player's record and match history
- **Steam login** - Players sign in with Steam OpenID; admins are set by Steam ID

Teams, matches and ELO come from the seed data for now. Entering them in the app, and calculating ELO, is still to come.

## Contributing

Contributions are welcome! Please read the [Contributing Guide](.github/CONTRIBUTING.md) before opening a PR.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Spring Boot 4.0.8, Java 17, Spring Security, Spring Data JPA |
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Vite, React Router 7, TanStack Query 5 |
| **Database** | PostgreSQL 16 |
| **Auth** | Steam OpenID |
| **DevOps** | Docker Compose, GitHub Actions, GitHub Container Registry |

## Project Structure

```
IDLWebApp/
├── backend/                          # Spring Boot application
│   └── src/main/java/.../IDLWebApp/
│       ├── controller/               # REST API controllers
│       ├── service/                  # Business logic layer
│       ├── repository/               # Spring Data JPA repositories
│       ├── model/                    # JPA entities and enums
│       ├── dto/                      # Data transfer objects
│       └── config/                   # Security and app configuration
│   └── scripts/reset-db.sh           # Reset a DB to the seed snapshot
├── frontend/                         # React SPA
│   └── src/
│       ├── components/               # Reusable UI components
│       ├── pages/                    # Route-level page components
│       ├── services/                 # API query hooks
│       └── types.ts                  # TypeScript type definitions
├── docker-compose.yml                # Full stack; prod runs this file
└── .github/workflows/deploy.yml      # CI/CD pipeline
```

## Local Development

Requires Docker (with Compose), Java 17 and Node.js.

```bash
# 1. Database (Postgres on port 5332, data kept in a Docker volume)
cd backend
docker compose up -d

# 2. Backend on http://localhost:8080 (creates/updates tables on startup)
./mvnw spring-boot:run

# 3. Frontend on http://localhost:5173 (proxies /api and /auth to the backend, like nginx in prod)
cd ../frontend
npm install
npm run dev
```

### Seed data

The database is never wiped or seeded on startup. Data persists until you reset it with:

```bash
backend/scripts/reset-db.sh          # dev DB
IDL_PROD_SSH=<host> backend/scripts/reset-db.sh prod   # prod DB, asks for confirmation
```

This empties every table and reloads `backend/src/main/resources/data.sql` in a single transaction. This data is a snapshot of actual IDL Elos with some fake seasons/matches and serves only as a placeholder until I import the real data.

Hibernate (`ddl-auto=update`) adds new tables and columns automatically, but won't change a column's type, rename or drop anything. After that kind of entity change, recreate the dev DB with `docker compose down -v && docker compose up -d` in `backend/`, start the backend, then run the reset script.

## Deployment

Prod is https://idl-uk.com, on a DigitalOcean droplet (Ubuntu 24.04). A push to `main` runs the tests, pushes both images to GHCR, then deploys over SSH through a Cloudflare Tunnel. The deploy copies the root `docker-compose.yml` to `/opt/idlwebapp`, so the repo's compose file is the one prod runs. The only other file on the server is the `.env` beside it.

Setting up a new server, as root:

```bash
# 1 GB of swap, Docker, and log rotation so container logs can't fill the disk
fallocate -l 1G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo "/swapfile none swap sw 0 0" >> /etc/fstab
mkdir -p /etc/docker && echo '{"log-driver": "local"}' > /etc/docker/daemon.json
apt install docker.io docker-compose-v2

# cloudflared from Cloudflare's apt repo (pkg.cloudflare.com), then connect it with the tunnel's token
cloudflared service install <token>

mkdir -p /opt/idlwebapp && echo "DB_PASSWORD=$(openssl rand -hex 24)" > /opt/idlwebapp/.env
```

- **Tunnel routes:** `idl-uk.com` → `http://127.0.0.1:80`, `ssh.idl-uk.com` → `ssh://localhost:22`. A Cloudflare Access app guards `ssh.idl-uk.com` and only lets the CI service token through.
- **Firewall:** the droplet's DigitalOcean firewall allows no inbound traffic. The tunnel only connects outward.
- **Actions secrets:** `CF_ACCESS_CLIENT_ID` and `CF_ACCESS_CLIENT_SECRET` (the service token), `SSH_PRIVATE_KEY` (the deploy key, whose public half is in the server's `/root/.ssh/authorized_keys`), and `SSH_KNOWN_HOSTS`, from this on the server:
  ```bash
  for f in /etc/ssh/ssh_host_*_key.pub; do awk '{print "[localhost]:2222", $1, $2}' "$f"; done
  ```

## API Reference

### Players

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/players` | List all players (summary), highest ELO first |
| `GET` | `/api/players/{steamId}` | Get player details |
| `POST` | `/api/players` | Create a new player (admin) |

### Seasons

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/seasons` | List all seasons, newest first |
| `GET` | `/api/seasons/{id}` | Get season details, including teams |
| `POST` | `/api/seasons` | Create a new season (admin) |
| `DELETE` | `/api/seasons/{id}` | Delete a season with no teams or matches (admin) |

### Matches

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/matches` | List matches, newest first (optional `seasonId` filter) |
| `GET` | `/api/matches/{matchId}` | Get match details, including each player's ELO change |

### Signups

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/seasons/{seasonId}/signups` | Get signups for a season |
| `POST` | `/api/seasons/{seasonId}/signups` | Sign up for a season (requires auth) |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/login` | Initiate Steam OpenID login |
| `GET` | `/auth/callback` | Steam login callback |
| `GET` | `/auth/me` | Get current authenticated user |
| `POST` | `/auth/logout` | Sign out |
