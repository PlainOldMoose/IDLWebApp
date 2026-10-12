#!/usr/bin/env bash
# Wipes every table and reloads src/main/resources/data.sql, in a single transaction.
# Dev only: prod holds data entered since the snapshot, so it's never reset from it.
# Usage: scripts/reset-db.sh
# The tables must already exist (start the backend once against the DB first).
set -euo pipefail
(( $# == 0 )) || { echo "usage: $0 (dev only, takes no arguments)" >&2; exit 1; }
cd "$(dirname "$0")/.."

seed=src/main/resources/data.sql
# Not in git (real league data). Checked up front: a missing file would otherwise commit the TRUNCATE alone
[[ -f "$seed" ]] || { echo "Missing $seed (it's gitignored; copy it in first)." >&2; exit 1; }

PSQL='psql -U admin -d idlwebapp -v ON_ERROR_STOP=1 --single-transaction -q'
run() { docker compose -f docker-compose.yml exec -T db $PSQL; }

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
  cat "$seed"
} | run

echo "Dev DB reset to seed snapshot."
