# Contributing to the IDL Web Application

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
2. **(Optional) Copy the example env file and fill credentials**
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

## Making changes

### Branch naming
Always branch off of `main` using this format:

| Type | Format | Example |
|------|--------|---------|
| Feature | `feat/short-description` | `feat/match-history-page` |
| Bug fix | `fix/short-description` | `fix/auth-redirect-loop` |
| Chore | `chore/short-description` | `chore/update-dependencies` |

### Code Style
- **Backend:** Follow existing Spring Boot patterns — service/repository/controller separation
- Keep components small and focused — one responsibility per component/service
- No commented-out code in PRs

---

## Reporting Bugs

Open an issue using the **Bug Report** template. Include:
- Steps to reproduce
- Expected vs actual behaviour
- Screenshots if relevant

---