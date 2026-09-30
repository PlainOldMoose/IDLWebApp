# IDL WebApp

A full-stack web application for managing an **in-house Dota 2 league (IDL)**. Built to replace manual spreadsheet tracking with a proper platform for seasons, teams, matches, player ELO ratings, and Steam-authenticated signups.

## Why This Exists

Running an in-house Dota 2 league means juggling spreadsheets for player stats, match results, ELO calculations, and season standings. IDL WebApp centralises all of that into a single application where players can authenticate with Steam, sign up for seasons, and track their performance over time.

## Features

- **Season Management** - Create and manage league seasons with registration, active play, and completion phases
- **Team Organisation** - Assign players to teams with captains, track win/loss records and average ELO
- **Match Tracking** - Record match results for both tournament and in-house games, with Radiant/Dire side tracking
- **ELO Rating System** - Automatic ELO calculations with full history tracking per player
- **Steam Authentication** - Players log in via Steam OpenID, linking their Steam identity to their league profile

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) before opening a PR.

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
| `POST` | `/api/players` | Create a new player |

### Seasons

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/seasons` | List all seasons, newest first |
| `GET` | `/api/seasons/{id}` | Get season details, including teams |
| `POST` | `/api/seasons` | Create a new season |

### Matches

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/matches` | List matches, newest first (optional `seasonId` filter) |

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
