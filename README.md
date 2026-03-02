# IDL WebApp

A full-stack web application for managing an **in-house Dota 2 league (IDL)**. Built to replace manual spreadsheet tracking with a proper platform for seasons, teams, matches, player ELO ratings, and Steam-authenticated signups.

## Why This Exists

Running an in-house Dota 2 league means juggling spreadsheets for player stats, match results, ELO calculations, and season standings. IDL WebApp centralises all of that into a single application where players can authenticate with Steam, sign up for seasons, and track their performance over time.

## Features

- **Season Management** — Create and manage league seasons with registration, active play, and completion phases
- **Team Organisation** — Assign players to teams with captains, track win/loss records and average ELO
- **Match Tracking** — Record match results for both tournament and in-house games, with Radiant/Dire side tracking
- **ELO Rating System** — Automatic ELO calculations with full history tracking per player
- **Steam Authentication** — Players log in via Steam OpenID, linking their Steam identity to their league profile
- **Match Scheduling** — Schedule upcoming matches and display them to the league

## Contributing

Contributions are welcome! Please read the [Contributing Guide](CONTRIBUTING.md) before opening a PR.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Spring Boot 4.0.1, Java 17, Spring Security, Spring Data JPA |
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
├── frontend-tailwind/                # React SPA (active frontend)
│   └── src/
│       ├── components/               # Reusable UI components
│       ├── pages/                    # Route-level page components
│       ├── services/                 # API client and query hooks
│       └── types/                    # TypeScript type definitions
├── docker-compose.yml                # Container orchestration
└── .github/workflows/deploy.yml      # CI/CD pipeline
```

## API Reference

### Players

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/players` | List all players (summary) |
| `GET` | `/api/players/{steamId}` | Get player details |
| `POST` | `/api/players` | Create a new player |

### Seasons

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/seasons` | List all seasons |
| `GET` | `/api/seasons/{id}` | Get season details |
| `POST` | `/api/seasons` | Create a new season |

### Matches

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/matches` | List matches (filterable by season, team, or player) |
| `GET` | `/api/matches/{matchId}` | Get match details |
| `GET` | `/api/matches/upcoming` | Get upcoming scheduled matches |

### Teams & Signups

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/seasons/{seasonId}/teams` | Get all teams for a season |
| `GET` | `/api/seasons/{seasonId}/signups` | Get signups for a season |
| `POST` | `/api/seasons/{seasonId}/signups` | Sign up for a season (requires auth) |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/login` | Initiate Steam OpenID login |
| `GET` | `/auth/callback` | Steam login callback |
| `GET` | `/auth/me` | Get current authenticated user |
