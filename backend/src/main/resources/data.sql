-- Players
INSERT INTO player (created_at, elo, steam_id, username)
VALUES ('2025-01-01 18:00:00', 1000, '123456789', 'Jerry'),
       ('2025-01-01 18:00:00', 1000, '223456789', 'Moose');

-- Matches
INSERT INTO matches (match_type, status, scheduled_time, played_time, match_winner, avg_elo)
VALUES (1, 2, '2025-01-02 18:00:00', '2025-01-02 18:05:00', 0, 1000),
       (1, 2, '2025-01-03 18:00:00', '2025-01-03 18:05:00', 1, 1025),
       (1, 2, '2025-01-04 18:00:00', '2025-01-04 18:05:00', 0, 1050),
       (1, 2, '2025-01-05 18:00:00', '2025-01-05 18:05:00', 1, 1075),
       (1, 2, '2025-01-06 18:00:00', '2025-01-06 18:05:00', 0, 1050);

-- Match participations (player on winning side for matches 1,2,3,5 - losing match 4)
INSERT INTO match_participant (match_id, player_id, side, is_sub)
VALUES (1, 1, 0, false), -- Radiant, Radiant wins = WIN
       (2, 1, 1, false), -- Dire, Dire wins = WIN
       (3, 1, 0, false), -- Radiant, Radiant wins = WIN
       (4, 1, 0, false), -- Radiant, Dire wins = LOSS
       (5, 1, 0, false);
-- Radiant, Radiant wins = WIN

-- Elo history for each match
INSERT INTO elo_history (player_id, match_id, elo, timestamp, reason)
VALUES (1, 1, 1025, '2025-01-02 18:05:00', 0), -- +25 WIN
       (1, 2, 1050, '2025-01-03 18:05:00', 0), -- +25 WIN
       (1, 3, 1075, '2025-01-04 18:05:00', 0), -- +25 WIN
       (1, 4, 1050, '2025-01-05 18:05:00', 1), -- -25 LOSS
       (1, 5, 1075, '2025-01-06 18:05:00', 0); -- +25 WIN;