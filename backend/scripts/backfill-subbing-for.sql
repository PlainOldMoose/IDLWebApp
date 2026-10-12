-- One-off: fills in who a sub stood in for on season matches saved before the Add match form recorded it. Only where
-- it's clear: a side with exactly one sub and exactly one of that side's team missing. Rows already set are left alone,
-- so it's safe to run again. Run it once, after the deploy that adds the form change:
--   dev:  docker compose -f backend/docker-compose.yml exec -T db psql -U admin -d idlwebapp -v ON_ERROR_STOP=1 --single-transaction < backend/scripts/backfill-subbing-for.sql
--   prod: ssh idl-prod "cd /opt/idlwebapp && docker compose exec -T db psql -U admin -d idlwebapp -v ON_ERROR_STOP=1 --single-transaction" < backend/scripts/backfill-subbing-for.sql
-- Delete this file once prod has run it.

WITH sides AS (
    SELECT m.match_id, s.side, CASE s.side WHEN 'RADIANT' THEN m.radiant_team_id ELSE m.dire_team_id END AS team_id
    FROM matches m
    CROSS JOIN (VALUES ('RADIANT'), ('DIRE')) AS s(side)
    WHERE m.season_id IS NOT NULL
),
lone_subs AS (
    SELECT sd.match_id, sd.side, min(mp.id) AS participant_id
    FROM sides sd
    JOIN match_participant mp ON mp.match_id = sd.match_id AND mp.side = sd.side AND mp.is_sub
    GROUP BY sd.match_id, sd.side
    HAVING count(*) = 1
),
lone_missing AS (
    SELECT sd.match_id, sd.side, min(tm.player_id) AS player_id
    FROM sides sd
    JOIN team_member tm ON tm.team_id = sd.team_id
    WHERE NOT EXISTS (SELECT 1 FROM match_participant mp WHERE mp.match_id = sd.match_id AND mp.player_id = tm.player_id)
    GROUP BY sd.match_id, sd.side
    HAVING count(*) = 1
)
UPDATE match_participant mp
SET subbing_for_id = lone_missing.player_id
FROM lone_subs
JOIN lone_missing USING (match_id, side)
WHERE mp.id = lone_subs.participant_id
  AND mp.subbing_for_id IS NULL;
