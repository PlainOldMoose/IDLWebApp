-- One-off: lets an existing database store the DRAFTING season status. Hibernate made season_status_check from the
-- enum when the table was created, and ddl-auto=update never changes a check, so closing sign-ups fails without this.
-- Keeps all data. Run it once, right after that deploy:
--   dev:  docker compose -f backend/docker-compose.yml exec -T db psql -U admin -d idlwebapp -v ON_ERROR_STOP=1 --single-transaction < backend/scripts/migrate-season-drafting.sql
--   prod: ssh "$IDL_PROD_SSH" "cd /opt/idlwebapp && docker compose exec -T db psql -U admin -d idlwebapp -v ON_ERROR_STOP=1 --single-transaction" < backend/scripts/migrate-season-drafting.sql
-- A fresh database doesn't need it. Delete this file once prod has run it.

ALTER TABLE season
    DROP CONSTRAINT IF EXISTS season_status_check,
    ADD CONSTRAINT season_status_check CHECK (status IN ('REGISTRATION', 'DRAFTING', 'ACTIVE', 'COMPLETED'));
