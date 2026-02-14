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

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Spring Boot 4.0.1, Java 17, Spring Security, Spring Data JPA |
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Vite, React Router 7, TanStack Query 5 |
| **Database** | PostgreSQL 16 |
| **Auth** | Steam OpenID |
| **DevOps** | Docker Compose, GitHub Actions, GitHub Container Registry |

## Getting Started

### Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/PlainOldMoose/IDLWebApp.git
   cd IDLWebApp
   ```

2. Start all services:
   ```bash
   docker-compose up
   ```

4. Access the application:
   - **Frontend:** http://localhost
   - **Backend API:** http://localhost:8080/api

### Local Development

#### Prerequisites

- Java 17
- Node.js 18+
- PostgreSQL 16
- Maven

#### Backend

```bash
cd backend
mvn spring-boot:run
```

The API will be available at http://localhost:8080.

#### Frontend

```bash
cd frontend-tailwind
npm install
npm run dev
```

The dev server will be available at http://localhost:5173.

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

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |
| `SPRING_DATASOURCE_URL` | PostgreSQL connection URL | — |
| `SPRING_DATASOURCE_USERNAME` | Database username | — |
| `SPRING_DATASOURCE_PASSWORD` | Database password | — |

### Database

- Development uses `create-drop` DDL strategy — the schema is recreated on every restart
- Sample data loads automatically from `backend/src/main/resources/data.sql`

## Development Commands

### Backend

```bash
cd backend
mvn spring-boot:run       # Run locally
mvn clean package         # Build JAR
mvn test                  # Run tests
```

### Frontend

```bash
cd frontend-tailwind
npm install               # Install dependencies
npm run dev               # Start dev server
npm run build             # Production build
npm run lint              # Run ESLint
```

### Docker

```bash
docker-compose up              # Start all services
docker-compose up -d           # Start in background
docker-compose up --build      # Rebuild and start
docker-compose down            # Stop and remove containers
```

## Contributing

Coming Soon

## License

MIT
