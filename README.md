# IDL WebApp

A full-stack web application for managing an **in-house Dota 2 league (IDL)**. Built to replace manual spreadsheet tracking with a proper platform for seasons, teams, matches, player ELO ratings, and Steam-authenticated signups.

## To do for `security-followups` (remove this section before merging)

Manual steps the code changes on this branch can't do.

**Before merging**

- [ ] Add the `SSH_KNOWN_HOSTS` Actions secret, or deploys stop at the SSH step (prod stays as it was). On the server:
  ```bash
  for f in /etc/ssh/ssh_host_*_key.pub; do awk '{print "[localhost]:2222", $1, $2}' "$f"; done
  ```
  Paste the output into GitHub → Settings → Secrets and variables → Actions.
- [ ] Review the branch, commit, open the PR.

**Right after the merge deploys**

- [ ] Run `backend/scripts/migrate-enum-names.sql` on prod (the command is at the top of the file), then delete the file. Until it runs, the match and player pages fail on the old columns. It runs in one transaction, so if it errors nothing changes (`character varying + integer` means the tables were already recreated and there's nothing to migrate).

**Any time**

- [ ] Cloudflare → SSL/TLS → Edge Certificates → turn on **Always Use HTTPS**. Check: `curl -I http://idl.vandermerwe.uk/` returns 301.
- [ ] Rotate the prod DB password. Changing the env var alone does nothing to an existing database, so in `/opt/idlwebapp`:
  1. `openssl rand -hex 24`
  2. `docker compose exec db psql -U admin -d idlwebapp -c "ALTER USER admin PASSWORD '<new>'"`
  3. Put the new password in the prod compose for both `POSTGRES_PASSWORD` and `SPRING_DATASOURCE_PASSWORD` (or a `.env` beside it)
  4. `docker compose up -d`
- [ ] Prod compose: if cloudflared runs on the same machine, bind the frontend as `127.0.0.1:80:80`. Make sure the router doesn't forward port 80 (`curl -m5 http://<home IP>/` from outside should time out).
- [ ] Recreate the dev DB, which wipes it. It now runs Postgres 16 like prod (it was on `latest`, 18, whose data 16 can't open) and only listens on localhost: `cd backend && docker compose down -v && docker compose up -d`, start the backend once, then `scripts/reset-db.sh`.
- [ ] If you use the root `docker-compose.yml`, put `DB_PASSWORD=...` in a `.env` next to it; it no longer has a default.

**Undecided**

- Removing the fallback admin Steam ID from `application.properties`: set `ADMIN_STEAM_IDS` in the prod compose first, or you lose admin on the next deploy.
- `@EnableWebSecurity` on `SecurityConfig` is redundant (Spring Boot applies it), but Claude's permission check blocked removing it. Delete the annotation and its import yourself if you want it gone.

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
├── docker-compose.yml                # Container orchestration
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
