# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IDLWebApp is a full-stack web application for managing a Dota 2 in-house league. It tracks players, matches, seasons, teams, and ELO ratings.

**Tech Stack:**
- Backend: Spring Boot 4.0.1 with Java 17
- Frontend: React 19 with TypeScript, Vite, React Query, React Router 7
- Database: PostgreSQL 16
- Containerization: Docker Compose

## Development Commands

### Backend (Spring Boot)
From `backend/` directory:
- **Build**: `mvn clean package`
- **Run locally**: `mvn spring-boot:run`
- **Run tests**: `mvn test`
- **Run single test**: `mvn test -Dtest=ClassName#methodName`

The backend runs on port 8080 by default.

### Frontend (React + Vite)
From `frontend/` directory:
- **Install dependencies**: `npm install`
- **Dev server**: `npm run dev` (runs on Vite's default port)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Preview production build**: `npm run preview`

### Docker
From root directory:
- **Start all services**: `docker-compose up`
- **Start in background**: `docker-compose up -d`
- **Stop services**: `docker-compose down`
- **Rebuild containers**: `docker-compose up --build`

Docker Compose configuration:
- PostgreSQL: Internal port 5432
- Backend: Port 8080
- Frontend: Port 80 (nginx)

## Development Tools

### Code Search
- **Preferred**: Use **ast-grep** for searching code structures, patterns, and AST-based queries
  - More accurate than text-based search for finding classes, methods, and code patterns
  - Understands Java and TypeScript syntax
  - Available via the ast-grep agent skill
- **Alternative**: Use Grep for simple text searches when ast-grep is not needed

## Architecture

### Backend Architecture

**Package Structure:**
```
com.plainoldmoose.IDLWebApp
├── controller/     REST controllers (Player, Match, Season, Team)
├── service/        Business logic layer
├── repository/     JPA repositories for data access
├── model/          JPA entities (Player, Match, Season, Team, EloHistory, MatchParticipant)
│   └── enums/      Enums (MatchStatus, MatchType, SeasonStatus, Side)
└── dto/            Data Transfer Objects
    ├── request/    Request DTOs for API endpoints
    └── response/   Response DTOs organized by domain (match/, player/, season/, team/)
```

**Key Design Patterns:**
- Standard Spring Boot layered architecture: Controller → Service → Repository
- DTOs separate internal models from API contracts
- Lombok annotations reduce boilerplate (@Getter, @Setter, @AllArgsConstructor, etc.)
- JPA entity relationships: `@OneToMany`, `@ManyToOne` for database associations

**Core Domain Models:**
- **Player**: Steam ID (primary key), username, ELO rating, timestamps
- **Match**: Match ID, type, season, radiant/dire teams, status, winner, participants
- **Season**: UUID, name, status, start/end dates, associated teams
- **Team**: Team ID, name, season, captain
- **MatchParticipant**: Join table connecting Player and Match with team/side info
- **EloHistory**: Tracks ELO changes over time per player

**Database Configuration:**
- Local dev uses PostgreSQL on port 5332 (see `application.properties`)
- Docker uses PostgreSQL on internal port 5432
- `spring.jpa.hibernate.ddl-auto = create-drop` recreates schema on startup
- Sample data loaded from `data.sql` on initialization

### Frontend Architecture

**Directory Structure:**
```
frontend/src/
├── components/       Reusable UI components (Navbar, SeasonCard, match/, playerlist/)
├── pages/           Route-level components (Leaderboard, PlayerProfile, Matches, Seasons)
├── services/        API layer (Api.tsx, Queries.tsx)
├── types/           TypeScript type definitions (Player, Match, Season)
├── hooks/           Custom React hooks
└── assets/          Static assets
```

**Key Patterns:**
- React Router 7 for client-side routing
- TanStack Query (React Query) for server state management
- Axios for HTTP requests with a shared base URL (`http://localhost:8080/api`)
- Bootstrap 5 + custom CSS for styling
- Type-safe API layer with TypeScript interfaces matching backend DTOs

**API Integration:**
- Base URL: `http://localhost:8080/api`
- Endpoints: `/players`, `/players/{steamId}`, `/matches`, `/seasons`
- React Query handles caching, background refetching, and loading states

## Important Notes

**Database Initialization:**
- The backend uses `create-drop` strategy, so the database is reset on every restart
- Sample data is auto-loaded from `backend/src/main/resources/data.sql`
- To modify test data, edit `data.sql` before starting the backend

**CORS:**
- The backend must be configured to allow requests from the frontend origin during local development

**Steam ID Format:**
- Steam IDs are 17-character strings (e.g., '76561198090941991')
- Used as the primary key for Player entities

**Match Data:**
- Match IDs are sourced from actual Dota 2 match IDs (Long type)
- ELO calculations and history tracking are managed through MatchParticipant and EloHistory entities
