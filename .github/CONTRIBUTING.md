# Contributing to IDLWebApp

Thanks for your interest in contributing! Please read this before opening a PR.

## Tech Stack

- **Backend:** Java 17, Springboot, PostgreSQL
- **Frontend:** React, TailwindCSS, Axios, TanStack Query

---

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- Docker 28+

### Local setup

1. **Fork and clone the repo**
```bash
git clone https://github.com/YOUR_USERNAME/IDLWebApp.git
```
2. **Copy the example env file and fill credentials**
```bash
cp .env.example .env
```
3. **Start docker and the database**
```bash
docker compose up -d 
```
4. **Run the backend**
```bash
cd backend
./mvnw spring-boot:run
```
5. **Run the frontend**
```bash
cd ../frontend
npm install
npm run dev
```

The application should be running at `http://localhost:5173`
