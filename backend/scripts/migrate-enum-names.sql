-- One-off: brings an existing database in line with the entities once enums are stored by name and the unused
-- match and team member columns are gone. ddl-auto=update can't change a column's type or drop one, so without
-- this the match and player pages fail on old data. Keeps all data. Run it once, right after that deploy:
--   dev:  docker compose -f backend/docker-compose.yml exec -T db psql -U admin -d idlwebapp -v ON_ERROR_STOP=1 --single-transaction < backend/scripts/migrate-enum-names.sql
--   prod: ssh "$IDL_PROD_SSH" "cd /opt/idlwebapp && docker compose exec -T db psql -U admin -d idlwebapp -v ON_ERROR_STOP=1 --single-transaction" < backend/scripts/migrate-enum-names.sql
-- A fresh database doesn't need it. Delete this file once prod has run it.

ALTER TABLE matches
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS scheduled_time,
    DROP COLUMN IF EXISTS match_type,
    DROP CONSTRAINT IF EXISTS matches_match_id_check;
ALTER TABLE team_member DROP COLUMN IF EXISTS season_id;

-- Enums were stored as their position in the Java declaration, starting at 0
ALTER TABLE matches
    DROP CONSTRAINT IF EXISTS matches_match_winner_check,
    ALTER COLUMN match_winner TYPE varchar(255) USING (ARRAY ['RADIANT', 'DIRE'])[match_winner + 1],
    ADD CONSTRAINT matches_match_winner_check CHECK (match_winner IN ('RADIANT', 'DIRE'));
ALTER TABLE match_participant
    DROP CONSTRAINT IF EXISTS match_participant_side_check,
    ALTER COLUMN side TYPE varchar(255) USING (ARRAY ['RADIANT', 'DIRE'])[side + 1],
    ADD CONSTRAINT match_participant_side_check CHECK (side IN ('RADIANT', 'DIRE'));
ALTER TABLE elo_history
    DROP CONSTRAINT IF EXISTS elo_history_reason_check,
    ALTER COLUMN reason TYPE varchar(255) USING (ARRAY ['MATCH_WIN', 'MATCH_LOSS', 'INITIAL', 'MANUAL_ADJUSTMENT'])[reason + 1],
    ADD CONSTRAINT elo_history_reason_check CHECK (reason IN ('MATCH_WIN', 'MATCH_LOSS', 'INITIAL', 'MANUAL_ADJUSTMENT'));

-- is_sub is a plain boolean now, which can't hold NULL
UPDATE match_participant SET is_sub = false WHERE is_sub IS NULL;
ALTER TABLE match_participant ALTER COLUMN is_sub SET NOT NULL;
