-- The old sheet's games without all 10 players' ELO have no real average, so they store none. Safe to rerun.
-- Hibernate's ddl-auto=update won't drop the NOT NULL the column got as an int, so it's done here.
ALTER TABLE matches ALTER COLUMN avg_elo DROP NOT NULL;
UPDATE matches m SET avg_elo = NULL
WHERE (SELECT count(DISTINCT h.player_id) FROM elo_history h WHERE h.match_id = m.match_id) < 10;
