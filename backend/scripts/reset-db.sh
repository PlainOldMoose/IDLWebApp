#!/usr/bin/env bash
# Wipes every table and reloads src/main/resources/data.sql, in a single transaction.
# Usage: scripts/reset-db.sh [dev|prod]   (default: dev)
#   dev:  the Postgres container from backend/docker-compose.yml
#   prod: the server's Postgres over SSH, via the idl-prod host in ~/.ssh/config (override with IDL_PROD_SSH)
# The tables must already exist (start the backend once against the DB first).
set -euo pipefail
cd "$(dirname "$0")/.."

target="${1:-dev}"
PSQL='psql -U admin -d idlwebapp -v ON_ERROR_STOP=1 --single-transaction -q'

case "$target" in
  dev)
    run() { docker compose -f docker-compose.yml exec -T db $PSQL; } ;;
  prod)
    host="${IDL_PROD_SSH:-idl-prod}"
    read -rp "This will WIPE the PROD database. Type 'prod' to continue: " ok
    [[ "$ok" == prod ]] || { echo "Aborted."; exit 1; }
    run() { ssh "$host" "cd /opt/idlwebapp && docker compose exec -T db $PSQL"; } ;;
  *)
    echo "usage: $0 [dev|prod]" >&2; exit 1 ;;
esac

{
  cat <<'SQL'
DO $$
DECLARE tables text;
BEGIN
  SELECT string_agg(format('%I.%I', schemaname, tablename), ', ') INTO tables
  FROM pg_tables WHERE schemaname = 'public';
  IF tables IS NULL THEN
    RAISE EXCEPTION 'No tables found. Start the backend once so Hibernate creates them, then rerun this script.';
  END IF;
  EXECUTE 'TRUNCATE ' || tables || ' RESTART IDENTITY CASCADE';
END $$;
SQL
  cat src/main/resources/data.sql
} | run

echo "$target DB reset to seed snapshot."
