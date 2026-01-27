# IDL WebApp

A full-stack web application for managing a Dota 2 in-house league. Track players, matches, seasons, teams, and ELO ratings.

## Tech Stack

- **Backend**: Spring Boot 4.0.1 with Java 17
- **Frontend**: React 19 with TypeScript, Vite, TanStack Query, React Router 7
- **Database**: PostgreSQL 16
- **Containerization**: Docker Compose

## Quick Start

### Using Docker (Recommended)

1. Clone the repository
2. Create a `.env` file in the root directory:
   ```
   ADMIN_CREDENTIALS=admin:yourpassword
   ```
3. Start all services:
   ```bash
   docker-compose up
   ```
4. Access the application:
   - Frontend: http://localhost
   - Backend API: http://localhost:8080/api

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

The API runs on http://localhost:8080.

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on http://localhost:5173.

## Project Structure

```
IDLWebApp/
├── backend/                 # Spring Boot application
│   └── src/main/java/com/plainoldmoose/IDLWebApp/
│       ├── controller/      # REST controllers
│       ├── service/         # Business logic
│       ├── repository/      # Data access layer
│       ├── model/           # JPA entities
│       └── dto/             # Data transfer objects
├── frontend/                # React application
│   └── src/
│       ├── components/      # Reusable UI components
│       ├── pages/           # Route-level components
│       ├── services/        # API layer
│       └── types/           # TypeScript definitions
└── docker-compose.yml       # Container orchestration
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/players` | List all players |
| `GET /api/players/{steamId}` | Get player details |
| `GET /api/matches` | List all matches |
| `GET /api/seasons` | List all seasons |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_CREDENTIALS` | Admin login credentials (format: `user:pass`) | - |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins | `http://localhost:5173` |
| `SPRING_DATASOURCE_URL` | Database connection URL | - |
| `SPRING_DATASOURCE_USERNAME` | Database username | - |
| `SPRING_DATASOURCE_PASSWORD` | Database password | - |

### Database

- Development uses `create-drop` DDL strategy (schema recreates on restart)
- Sample data loads automatically from `backend/src/main/resources/data.sql`

## Development Commands

### Backend

```bash
mvn clean package      # Build
mvn test               # Run tests
mvn spring-boot:run    # Run locally
```

### Frontend

```bash
npm install            # Install dependencies
npm run dev            # Development server
npm run build          # Production build
npm run lint           # Run linter
```

### Docker

```bash
docker-compose up              # Start all services
docker-compose up -d           # Start in background
docker-compose down            # Stop services
docker-compose up --build      # Rebuild and start
```

## License

MIT
