# Review guide: IDLWebApp

## Checks
- Backend (Java / Spring Boot): `cd backend && ./mvnw verify`
- Frontend (TS / React): `cd frontend && npx tsc -b && npm run lint && npx vitest run`

## Failure patterns here
- Java: swallowed exceptions, missing `@Transactional` boundaries, lazy-loading outside a session,
  N+1 queries from JPA relations, unbounded queries
- TS: `any` leaking through boundaries, unhandled promise rejections, stale React state,
  React Query keys that don't include every input
- Endpoints missing auth/permission checks (Spring Security config, method security); unvalidated input
  (missing `@Valid` on request bodies)

## Severity tags
- important: likely bug, security issue, data loss, unintended behaviour change
- nit: minor and non-blocking
- pre-existing: present before this diff; not caused by it
- Do not report style issues ESLint already covers.

## Risk tiers
- Low: docs, copy, styling, tests only
- Medium: ordinary controllers, services, components, business logic
- High: auth/security config, JPA entity or schema changes (no migration tool, so entity edits change the DB),
  anything touching live league data, `docker-compose.yml`, `Dockerfile`, `.github/workflows/`

## Skip
- `backend/target/`, `frontend/dist/`, `node_modules/`, lockfiles, generated code

## Loop rules
- Maximum 3 review rounds. After round 3, stop and recommend reconsidering the approach.
- Rounds 2+: only review lines changed since the previous round.
- When you find a bug, name its class and check for every other instance in the same pass.
- Never repeat a finding already raised.
