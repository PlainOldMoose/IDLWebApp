# IDL WebApp

A full-stack web application for managing an **in-house Dota 2 league (IDL)**. Built to replace manual spreadsheet tracking with a proper platform for seasons, teams, matches, player ELO ratings, and Steam-authenticated signups.

## Why This Exists

Running an in-house Dota 2 league means juggling spreadsheets for player stats, match results, ELO calculations, and season standings. IDL WebApp centralises all of that into a single application where players can authenticate with Steam, sign up for seasons, and track their performance over time.

## Features

- **Seasons** - Admins create seasons; players sign up with their role preferences and whether they'd captain
- **Teams and standings** - Each season's teams, captains, win/loss records and average ELO
- **Matches** - Season and in-house results with Radiant/Dire sides and each player's ELO change. Admins can add a game the league ticket missed, or delete one, while its season is active
- **ELO** - Calculated with the league's formula; adding or removing a past game replays everyone's ELO from that game on
- **In-houses** - Pick 10 players and the balancer offers the 3 most even teams. Players report the result, and an admin approves it before ELO moves
- **Players** - An ELO ladder, plus each player's record and match history
- **Steam login** - Players sign in with Steam OpenID; admins are set by Steam ID

Teams and past seasons come from the seed data for now. Creating teams in the app is still to come.

## Suggestions

Got an idea or something you'd like changed? Use the [suggestion form](https://github.com/PlainOldMoose/IDLWebApp/issues/new?template=suggestion.yml) - no technical knowledge needed, just a free GitHub account. Raising it on GitHub greatly helps me track suggestions, but as a last resort you can copy the template in the [Contributing Guide](.github/CONTRIBUTING.md#prefer-discord) and DM me on Discord.

## Contributing

Contributions are welcome! Please read the [Contributing Guide](.github/CONTRIBUTING.md) before opening a PR.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Spring Boot 4.1.1, Java 17, Spring Security, Spring Data JPA |
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
│   └── scripts/reset-db.sh           # Reset a DB to the seed snapshot (data.sql, not in git)
├── frontend/                         # React SPA
│   └── src/
│       ├── components/               # Reusable UI components
│       ├── pages/                    # Route-level page components
│       ├── services/                 # API query hooks
│       ├── util/                     # Formatting and shared styles
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
| `POST` | `/api/seasons/{id}/complete` | End an active season and record its winner (admin) |
| `DELETE` | `/api/seasons/{id}` | Delete a season with no teams or matches (admin) |

### Matches

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/matches` | List matches, newest first (optional `seasonId` filter) |
| `GET` | `/api/matches/{matchId}` | Get match details, including each player's ELO change |
| `POST` | `/api/matches` | Add a match to an active season, replaying ELO from it (admin) |
| `DELETE` | `/api/matches/{matchId}` | Delete an active season's match, replaying ELO without it (admin) |

### Signups

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/seasons/{seasonId}/signups` | Get signups for a season |
| `POST` | `/api/seasons/{seasonId}/signups` | Sign up for a season, or update your sign-up (requires auth) |
| `DELETE` | `/api/seasons/{seasonId}/signups` | Withdraw your own sign-up (requires auth) |

### In-houses

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/inhouses/balance?players=...` | The 3 most even splits of 10 players (Steam IDs) |
| `GET` | `/api/inhouses` | In-houses with no result reported yet, newest first |
| `GET` | `/api/inhouses/pending` | Reported results waiting for approval, with each player's ELO change (admin) |
| `POST` | `/api/inhouses` | Start an in-house with two teams of 5 (requires auth) |
| `POST` | `/api/inhouses/{id}/result` | Report the winner and Team A's side (its players or an admin) |
| `POST` | `/api/inhouses/{id}/approve` | Approve a reported result into a match and move ELO (admin) |
| `DELETE` | `/api/inhouses/{id}` | Cancel or reject an in-house (its players or an admin) |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/login` | Initiate Steam OpenID login |
| `GET` | `/auth/callback` | Steam login callback |
| `GET` | `/auth/me` | Get current authenticated user |
| `POST` | `/auth/logout` | Sign out |
