# Contributing to the IDL Web Application

Thanks for your interest in contributing! Please read this before opening a PR.

## Suggestions

You don't need to code to help out. If you have an idea or something you'd like changed:

1. Sign in to GitHub (a free account is all you need)
2. Open the [suggestion form](https://github.com/PlainOldMoose/IDLWebApp/issues/new?template=suggestion.yml)
3. Describe your idea in your own words and press **Create**

That's it - I'll reply on your suggestion.

### Prefer Discord?

Raising it on GitHub yourself greatly helps me keep track of everything, so please treat Discord as a last resort. If GitHub really isn't for you, copy this template, fill it in and DM me instead:

```
Suggestion:
What's your idea?
Why would it help?
Anything else? (screenshots, links, examples)
```

If you're a developer with a detailed proposal, you may wish to use the [Feature Request](https://github.com/PlainOldMoose/IDLWebApp/issues/new?template=feature_request.md) template instead.

## Tech Stack

- **Backend:** Java 17, Springboot, PostgreSQL
- **Frontend:** React, TailwindCSS, TanStack Query

## Getting Started

### Prerequisites
- Java 17+
- Node.js 20.19+
- Docker 28+

### Local setup

1. **Fork and clone the repo**
```bash
git clone https://github.com/YOUR_USERNAME/IDLWebApp.git
```
2. **Start docker and the database**
```bash
cd backend
docker compose up -d
```
3. **Run the backend**
```bash
./mvnw spring-boot:run
```
4. **Run the frontend**
```bash
cd ../frontend
npm install
npm run dev
```

The application should be running at `http://localhost:5173`

## Making changes

### Branch naming
Always branch off of `pre-release` using this format:

| Type | Format | Example |
|------|--------|---------|
| Feature | `feat/short-description` | `feat/match-history-page` |
| Bug fix | `fix/short-description` | `fix/auth-redirect-loop` |
| Chore | `chore/short-description` | `chore/update-dependencies` |

### Code Style
- **Backend:** Follow existing Spring Boot patterns - service/repository/controller separation
- Keep components small and focused - one responsibility per component/service
- No commented-out code in PRs


## Reporting Bugs

Open an issue using the **Bug Report** template. Include:
- Steps to reproduce
- Expected vs actual behaviour
- Screenshots if relevant
