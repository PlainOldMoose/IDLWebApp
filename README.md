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
