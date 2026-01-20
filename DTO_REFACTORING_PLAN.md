# DTO Refactoring Plan: IDLWebApp

## Executive Summary

This plan addresses critical type inconsistencies in the backend DTO layer and adds missing endpoints to support enhanced leaderboard filtering, match participant viewing, and upcoming tools (inhouse balancer, drafter, doodle).

**Key Requirements:**
- Teams have **fixed rosters** at season start (need Team-Player relationship in DB)
- View all 10 match participants with sub tracking
- Season-filtered leaderboard with rankings
- Basic team info (roster, captain, stats)
- Support for balancer/drafter tools

**Scope:** 9 phases ranging from critical fixes to tool support (discuss phase-by-phase below)

---

## Critical Issues Found

### 1. Type Inconsistencies (BUGS)
- `SeasonSummaryResponse.status` is String, but `SeasonDetailResponse.status` is SeasonStatus enum
- `RecentMatchResponse.eloChange` is int, but backend EloHistory stores Long
- Frontend `PlayerMatch` type has redundant fields (winner + won)

### 2. Missing Database Relationship
- **Team entity** has captain but NO roster relationship
- Need to add Team ↔ Player relationship for fixed rosters
- Currently: Team(captain_id) but no way to store/query team members

### 3. Missing DTOs & Endpoints
- No `MatchDetailResponse` to show all 10 participants
- No `ParticipantResponse` for player match participation
- `TeamResponse` only has teamName (missing captain, roster, stats)
- No `GET /api/matches/{id}` endpoint
- No filtering on matches (by season/team/player)

### 4. Frontend Gaps
- Match page links to external stratz.com instead of internal detail page
- No season-filtered leaderboard
- Types don't match backend (missing teams in Season, etc.)

---

## Phased Implementation Plan

### PHASE 1: Critical Type Fixes (REQUIRED - Bug Fixes)
**Goal:** Fix type mismatches that cause API contract bugs

**Changes:**
1. Change `SeasonSummaryResponse.status` from String to SeasonStatus enum
2. Change `RecentMatchResponse.eloChange` from int to Long
3. Update frontend `Season` type to include "DRAFT" status
4. Remove `winner` field from frontend `PlayerMatch` (redundant with `won`)

**Files:**
- `backend/.../dto/response/season/SeasonSummaryResponse.java`
- `backend/.../dto/response/player/RecentMatchResponse.java`
- `frontend/src/types/Season.tsx`
- `frontend/src/types/Player.tsx`

**Impact:** LOW effort, HIGH value - fixes bugs, no DB changes

**Recommendation:** ✅ **IMPLEMENT** (critical bug fixes)

---

### PHASE 2: Match Details & Participants (HIGH PRIORITY)
**Goal:** Show all 10 players in a match with sub tracking

**Changes:**
1. Create `ParticipantResponse` DTO (steamId, username, elo, side, eloChange, isSub, subbingFor)
2. Create `MatchDetailResponse` DTO (includes participants list, team names)
3. Add `MatchService.getMatchById()` method
4. Add `GET /api/matches/{id}` endpoint
5. Update frontend types (MatchDetail, Participant)
6. Update Api.tsx and Queries.tsx

**Database:** Uses existing MatchParticipant and EloHistory relationships

**Impact:** MEDIUM effort, HIGH value - enables match detail pages

**Recommendation:** ✅ **IMPLEMENT** (enables key feature)

---

### PHASE 3A: Database Schema - Team Roster Relationship (REQUIRED FOR PHASE 3B)
**Goal:** Add Team-Player relationship for fixed rosters

**Database Changes:**
1. Add `TeamMember` join table or `Player.team_id` column
2. **Option A (Recommended):** Many-to-Many via TeamMember
   - Allows historical tracking (player can be on different teams in different seasons)
   - Schema: `team_member(id, team_id, player_id, season_id)`
3. **Option B:** Simple Foreign Key
   - Add `team_id` to Player table
   - Simpler but less flexible (player can only be on one team ever)

**Recommendation:** Need to decide approach before Phase 3B

---

### PHASE 3B: Enhanced TeamResponse (DEPENDS ON 3A)
**Goal:** Complete team information with roster

**Changes:**
1. Create `TeamMemberResponse` DTO (steamId, username, currentElo)
2. Update `TeamResponse` to include:
   - teamId, teamName
   - captainSteamId, captainUsername
   - members (List<TeamMemberResponse>)
   - totalElo, wins, losses, winRate
3. Update `TeamService.mapToResponse()` to join roster data
4. Create frontend `Team.tsx` types

**Impact:** MEDIUM effort (HIGH if need DB schema changes), HIGH value

**Recommendation:** ⚠️ **DISCUSS** - Need Phase 3A database decision first

---

### PHASE 4: Match Filtering (MEDIUM PRIORITY)
**Goal:** Filter matches by season/team/player

**Changes:**
1. Add `MatchRepository` query methods (findBySeasonId, findByTeam, etc.)
2. Update `MatchService.getAllMatches()` to accept filters
3. Update `GET /api/matches` endpoint with optional query params
4. Update frontend Api.tsx for filtered queries

**Database:** Uses existing relationships, no schema changes

**Impact:** MEDIUM effort, MEDIUM value - improves match browsing

**Recommendation:** ✅ **IMPLEMENT** (useful for all features)

---

### PHASE 5: Season-Filtered Leaderboard (HIGH PRIORITY)
**Goal:** Rank players within a season

**Changes:**
1. Create `SeasonalPlayerStatsResponse` DTO (seasonal wins/losses/rank)
2. Add `PlayerService.getPlayersBySeasonRanked(seasonId)` method
3. Add `GET /api/players/by-season/{seasonId}` endpoint
4. Update frontend types and API calls

**Complexity:** HIGH - requires complex joins and calculations
- Join Player → MatchParticipant → Match (filtered by season)
- Join EloHistory for seasonal stats
- Calculate rank, avgEloChange

**Impact:** HIGH effort, HIGH value - enables enhanced leaderboard

**Recommendation:** ✅ **IMPLEMENT** (top user priority)

---

### PHASE 6: Tools Support DTOs (LOWER PRIORITY)
**Goal:** Provide data for inhouse balancer and drafter

**Changes:**
1. Create `PlayerBalanceResponse` DTO (elo, availability, recent stats)
2. Create `DraftPoolResponse` DTO (players + draft status)
3. Add `GET /api/players/available` endpoint (for balancer)
4. Add `GET /api/seasons/{id}/draft-pool` endpoint (for drafter)

**Impact:** LOW-MEDIUM effort, MEDIUM value (depends on tool timeline)

**Recommendation:** ⏸️ **DEFER** - Implement when building tools

---

### PHASE 7: Enhanced EloHistory in PlayerDetail (OPTIONAL)
**Goal:** Richer elo history data for better charting

**Changes:**
1. Change `PlayerDetailResponse.eloHistory` from List<Long> to List<EloHistoryResponse>
2. Includes timestamp, reason, eloChange per history entry
3. Update frontend EloHistory type
4. Update charting logic to use timestamps

**Impact:** LOW effort, LOW value - nice-to-have improvement

**Recommendation:** ⏸️ **DEFER** - Current List<Long> works fine

---

### PHASE 8-9: Frontend Sync (PART OF EACH PHASE)
**Goal:** Update frontend types and API calls

**Changes:** Done incrementally with each backend phase
- Phase 1: Type fixes
- Phase 2: Match types
- Phase 3B: Team types
- Phase 4: Filtered match queries
- Phase 5: Seasonal stats types

**Recommendation:** ✅ **IMPLEMENT** alongside backend changes

---

## Recommended Implementation Order

### Tier 1 - Critical (Must Do)
1. ✅ **Phase 1**: Type fixes (1-2 hours)
2. ✅ **Phase 2**: Match details (3-4 hours)
3. ⚠️ **Phase 3A**: Decide team roster DB schema (discussion + 2-3 hours)

### Tier 2 - High Priority (Should Do)
4. ✅ **Phase 3B**: Enhanced TeamResponse (2-3 hours, after 3A)
5. ✅ **Phase 4**: Match filtering (2-3 hours)
6. ✅ **Phase 5**: Seasonal leaderboard (4-5 hours, complex)

### Tier 3 - Nice to Have (Can Defer)
7. ⏸️ **Phase 6**: Tools DTOs (when building tools)
8. ⏸️ **Phase 7**: Enhanced elo history (low value)

---

## Database Schema Decision: Team Rosters

**Context:** Teams have fixed rosters at season start. Need to store team members.

### Option A: TeamMember Join Table (Recommended)
```sql
CREATE TABLE team_member (
    id UUID PRIMARY KEY,
    team_id UUID REFERENCES team(team_id),
    player_id VARCHAR(17) REFERENCES player(steam_id),
    season_id UUID REFERENCES season(id),
    joined_at TIMESTAMP,
    UNIQUE(team_id, player_id, season_id)
);
```

**Pros:**
- Player can be on different teams in different seasons
- Historical tracking
- Flexible for future features (trades, season-to-season movement)

**Cons:**
- More complex queries
- Extra table to manage

### Option B: Player.team_id Column
```sql
ALTER TABLE player ADD COLUMN current_team_id UUID REFERENCES team(team_id);
```

**Pros:**
- Simple queries (player.team.name)
- Easy to understand

**Cons:**
- Player can only be on ONE team total
- No historical data
- Doesn't support multi-season leagues well

**Recommendation:** Option A (TeamMember table) for long-term flexibility

---

## Final Scope Decision

**APPROVED PHASES:**
- ✅ Phase 1: Type Fixes (Critical)
- ✅ Phase 2: Match Details & Participants (High Priority)
- ✅ Phase 3: Team DTOs with Roster (High Priority - includes DB schema)
- ✅ Phase 4: Match Filtering (Medium Priority)
- ✅ Phase 5: Seasonal Leaderboard (High Priority)

**DEFERRED:**
- ⏸️ Phase 6: Tools DTOs (implement when building tools)
- ⏸️ Phase 7: Enhanced Elo History (low value)

**Team Roster Approach:** Option A (TeamMember join table)
- Teams are fixed per season
- Players may be on different teams in different seasons
- Subs come from sub pool (not on any team) - determined by comparing match participants to team roster
- Supports historical tracking

**Estimated Total Effort:** 15-20 hours

---

## Database Schema Changes

### New Table: team_member

```sql
CREATE TABLE team_member (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES team(team_id) ON DELETE CASCADE,
    player_id VARCHAR(17) NOT NULL REFERENCES player(steam_id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES season(id) ON DELETE CASCADE,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, player_id)  -- Player can only be on one team per team (handles season via team FK)
);

CREATE INDEX idx_team_member_team ON team_member(team_id);
CREATE INDEX idx_team_member_player ON team_member(player_id);
CREATE INDEX idx_team_member_season ON team_member(season_id);
```

**Entity Class:**
```java
@Entity
public class TeamMember {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    @ManyToOne
    @JoinColumn(name = "player_id")
    private Player player;

    @ManyToOne
    @JoinColumn(name = "season_id")
    private Season season;

    @Column(nullable = false)
    private LocalDateTime joinedAt;
}
```

**Update Team Entity:**
```java
@Entity
public class Team {
    // ... existing fields ...

    @OneToMany(mappedBy = "team")
    private List<TeamMember> members;
}
```

---

## Detailed Implementation Steps

### PHASE 1: Critical Type Fixes

**1.1 Fix SeasonSummaryResponse**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\dto\response\season\SeasonSummaryResponse.java
public record SeasonSummaryResponse(
    String name,
    SeasonStatus status,  // CHANGED: was String, now enum
    UUID id,
    LocalDate startDate,
    LocalDate endDate
) {}
```

**1.2 Fix RecentMatchResponse**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\dto\response\player\RecentMatchResponse.java
public record RecentMatchResponse(
    Long matchId,
    LocalDateTime timePlayed,
    boolean won,
    Long eloChange,  // CHANGED: was int, now Long
    String seasonName
) {}
```

**1.3 Update Frontend Types**
```typescript
// D:\git\IDLWebApp\frontend\src\types\Season.tsx
export interface Season {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "REGISTRATION" | "DRAFT" | "ACTIVE" | "COMPLETED";  // Added DRAFT
}

// D:\git\IDLWebApp\frontend\src\types\Player.tsx
export interface RecentMatch {
  matchId: number;
  timePlayed: string;
  won: boolean;
  eloChange: number;  // Now matches backend Long (JS number handles it)
  seasonName?: string;
  // REMOVED: winner field (was redundant)
}
```

**Files Modified:**
- `backend/dto/response/season/SeasonSummaryResponse.java`
- `backend/dto/response/player/RecentMatchResponse.java`
- `frontend/src/types/Season.tsx`
- `frontend/src/types/Player.tsx`

---

### PHASE 2: Match Details & Participants

**2.1 Create ParticipantResponse**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\dto\response\match\ParticipantResponse.java
package com.plainoldmoose.IDLWebApp.dto.response.match;

import com.plainoldmoose.IDLWebApp.model.enums.Side;

public record ParticipantResponse(
    String steamId,
    String username,
    Long currentElo,
    Side side,
    Long eloChange,
    boolean isSub,
    String subbingForSteamId,
    String subbingForUsername
) {}
```

**2.2 Create MatchDetailResponse**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\dto\response\match\MatchDetailResponse.java
package com.plainoldmoose.IDLWebApp.dto.response.match;

import com.plainoldmoose.IDLWebApp.model.enums.Side;
import java.time.LocalDateTime;
import java.util.List;

public record MatchDetailResponse(
    Long matchId,
    Side winner,
    LocalDateTime timePlayed,
    LocalDateTime scheduledTime,
    Long avgElo,
    String seasonName,
    String radiantTeamName,
    String direTeamName,
    List<ParticipantResponse> participants
) {}
```

**2.3 Update MatchService**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\service\MatchService.java

public MatchDetailResponse getMatchById(Long matchId) {
    Match match = matchRepository.findById(matchId)
        .orElseThrow(() -> new RuntimeException("Match not found"));

    List<ParticipantResponse> participants = match.getParticipants().stream()
        .map(this::mapToParticipantResponse)
        .toList();

    return new MatchDetailResponse(
        match.getMatchId(),
        match.getMatchWinner(),
        match.getPlayedTime(),
        match.getScheduledTime(),
        match.getAvgElo(),
        match.getSeason() != null ? match.getSeason().getName() : null,
        match.getRadiantTeam() != null ? match.getRadiantTeam().getName() : null,
        match.getDireTeam() != null ? match.getDireTeam().getName() : null,
        participants
    );
}

private ParticipantResponse mapToParticipantResponse(MatchParticipant participant) {
    Player player = participant.getPlayer();

    // Find elo change from EloHistory for this match
    Long eloChange = player.getEloHistory().stream()
        .filter(eh -> eh.getMatch() != null && eh.getMatch().getMatchId().equals(participant.getMatch().getMatchId()))
        .findFirst()
        .map(EloHistory::getEloChange)
        .orElse(0L);

    return new ParticipantResponse(
        player.getSteamId(),
        player.getUsername(),
        player.getElo(),
        participant.getSide(),
        eloChange,
        participant.getIsSub() != null && participant.getIsSub(),
        participant.getSubbingFor() != null ? participant.getSubbingFor().getSteamId() : null,
        participant.getSubbingFor() != null ? participant.getSubbingFor().getUsername() : null
    );
}
```

**2.4 Update MatchController**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\controller\MatchController.java

@GetMapping("/{matchId}")
public MatchDetailResponse getMatchById(@PathVariable Long matchId) {
    return matchService.getMatchById(matchId);
}
```

**2.5 Update Frontend Types**
```typescript
// D:\git\IDLWebApp\frontend\src\types\Match.tsx
export interface MatchDetail {
  matchId: number;
  winner: "RADIANT" | "DIRE";
  timePlayed: string;
  scheduledTime: string;
  avgElo: number;
  seasonName?: string;
  radiantTeamName?: string;
  direTeamName?: string;
  participants: Participant[];
}

export interface Participant {
  steamId: string;
  username: string;
  currentElo: number;
  side: "RADIANT" | "DIRE";
  eloChange: number;
  isSub: boolean;
  subbingForSteamId?: string;
  subbingForUsername?: string;
}
```

**2.6 Update Api.tsx and Queries.tsx**
```typescript
// D:\git\IDLWebApp\frontend\src\services\Api.tsx
export const getMatchDetail = async (matchId: number): Promise<MatchDetail> => {
  const response = await axiosInstance.get<MatchDetail>(`matches/${matchId}`);
  return response.data;
};

// D:\git\IDLWebApp\frontend\src\services\Queries.tsx
export function useMatchDetail(matchId: number | undefined) {
  return useQuery({
    queryKey: ["match", matchId],
    queryFn: () => getMatchDetail(matchId!),
    enabled: !!matchId,
  });
}
```

**Files Created:**
- `backend/dto/response/match/ParticipantResponse.java`
- `backend/dto/response/match/MatchDetailResponse.java`

**Files Modified:**
- `backend/service/MatchService.java`
- `backend/controller/MatchController.java`
- `frontend/src/types/Match.tsx`
- `frontend/src/services/Api.tsx`
- `frontend/src/services/Queries.tsx`

---

### PHASE 3: Team DTOs with Roster

**3.1 Create TeamMember Entity**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\model\TeamMember.java
package com.plainoldmoose.IDLWebApp.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TeamMember {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    @ManyToOne
    @JoinColumn(name = "season_id", nullable = false)
    private Season season;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    @PrePersist
    public void prePersist() {
        joinedAt = LocalDateTime.now();
    }
}
```

**3.2 Update Team Entity**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\model\Team.java
@Entity
public class Team {
    // ... existing fields ...

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL)
    private List<TeamMember> members = new ArrayList<>();
}
```

**3.3 Create TeamMemberRepository**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\repository\TeamMemberRepository.java
package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {
    List<TeamMember> findByTeamTeamId(UUID teamId);
    List<TeamMember> findByPlayerSteamId(String steamId);
}
```

**3.4 Create TeamMemberResponse DTO**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\dto\response\team\TeamMemberResponse.java
package com.plainoldmoose.IDLWebApp.dto.response.team;

public record TeamMemberResponse(
    String steamId,
    String username,
    Long currentElo
) {}
```

**3.5 Update TeamResponse**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\dto\response\team\TeamResponse.java
package com.plainoldmoose.IDLWebApp.dto.response.team;

import java.util.List;
import java.util.UUID;

public record TeamResponse(
    UUID teamId,
    String teamName,
    String captainSteamId,
    String captainUsername,
    List<TeamMemberResponse> members,
    Long totalElo,
    int wins,
    int losses,
    double winRate
) {}
```

**3.6 Create/Update TeamService**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\service\TeamService.java
@Service
@AllArgsConstructor
public class TeamService {
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;

    public TeamResponse mapToResponse(Team team) {
        List<TeamMemberResponse> members = team.getMembers().stream()
            .map(tm -> new TeamMemberResponse(
                tm.getPlayer().getSteamId(),
                tm.getPlayer().getUsername(),
                tm.getPlayer().getElo()
            ))
            .toList();

        int totalMatches = team.getWins() + team.getLosses();
        double winRate = totalMatches > 0 ? (team.getWins() * 100.0) / totalMatches : 0.0;

        return new TeamResponse(
            team.getTeamId(),
            team.getName(),
            team.getCaptain().getSteamId(),
            team.getCaptain().getUsername(),
            members,
            team.getTotalElo(),
            team.getWins(),
            team.getLosses(),
            winRate
        );
    }
}
```

**3.7 Update data.sql**
```sql
-- Add team members after teams are created
INSERT INTO team_member (id, team_id, player_id, season_id, joined_at)
VALUES
  ('...uuid...', 'f8c3de3d-1fea-4d7c-a8b0-29f63c4c1111', '76561198090941991', 'f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454', CURRENT_TIMESTAMP),
  ('...uuid...', 'f8c3de3d-1fea-4d7c-a8b0-29f63c4c1111', '76561198090941992', 'f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454', CURRENT_TIMESTAMP),
  -- ... more team members
;
```

**3.8 Update Frontend Types**
```typescript
// D:\git\IDLWebApp\frontend\src\types\Team.tsx
export interface Team {
  teamId: string;
  teamName: string;
  captainSteamId: string;
  captainUsername: string;
  members: TeamMember[];
  totalElo: number;
  wins: number;
  losses: number;
  winRate: number;
}

export interface TeamMember {
  steamId: string;
  username: string;
  currentElo: number;
}
```

**Files Created:**
- `backend/model/TeamMember.java`
- `backend/repository/TeamMemberRepository.java`
- `backend/dto/response/team/TeamMemberResponse.java`
- `backend/service/TeamService.java` (if doesn't exist)
- `frontend/src/types/Team.tsx`

**Files Modified:**
- `backend/model/Team.java`
- `backend/dto/response/team/TeamResponse.java`
- `backend/service/SeasonService.java` (uses TeamService.mapToResponse)
- `backend/src/main/resources/data.sql`

---

### PHASE 4: Match Filtering

**4.1 Update MatchRepository**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\repository\MatchRepository.java
public interface MatchRepository extends JpaRepository<Match, Long> {
    List<Match> findBySeasonId(UUID seasonId);
    List<Match> findByRadiantTeamTeamIdOrDireTeamTeamId(UUID teamId1, UUID teamId2);

    @Query("SELECT m FROM Match m JOIN m.participants p WHERE p.player.steamId = :steamId")
    List<Match> findByParticipantSteamId(@Param("steamId") String steamId);
}
```

**4.2 Update MatchService**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\service\MatchService.java
public List<MatchSummaryResponse> getAllMatches(UUID seasonId, UUID teamId, String playerSteamId) {
    List<Match> matches;

    if (seasonId != null) {
        matches = matchRepository.findBySeasonId(seasonId);
    } else if (teamId != null) {
        matches = matchRepository.findByRadiantTeamTeamIdOrDireTeamTeamId(teamId, teamId);
    } else if (playerSteamId != null) {
        matches = matchRepository.findByParticipantSteamId(playerSteamId);
    } else {
        matches = matchRepository.findAll();
    }

    // Apply additional filters if multiple params provided
    if (seasonId != null && teamId != null) {
        UUID finalTeamId = teamId;
        matches = matches.stream()
            .filter(m -> m.getRadiantTeam().getTeamId().equals(finalTeamId)
                      || m.getDireTeam().getTeamId().equals(finalTeamId))
            .toList();
    }

    if (seasonId != null && playerSteamId != null) {
        String finalSteamId = playerSteamId;
        matches = matches.stream()
            .filter(m -> m.getParticipants().stream()
                .anyMatch(p -> p.getPlayer().getSteamId().equals(finalSteamId)))
            .toList();
    }

    return matches.stream()
        .map(this::mapToSummaryResponse)
        .toList();
}
```

**4.3 Update MatchController**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\controller\MatchController.java
@GetMapping
public List<MatchSummaryResponse> getAllMatches(
    @RequestParam(required = false) UUID seasonId,
    @RequestParam(required = false) UUID teamId,
    @RequestParam(required = false) String playerSteamId
) {
    return matchService.getAllMatches(seasonId, teamId, playerSteamId);
}
```

**4.4 Update Frontend Api.tsx**
```typescript
// D:\git\IDLWebApp\frontend\src\services\Api.tsx
export const getFilteredMatches = async (
  seasonId?: string,
  teamId?: string,
  playerSteamId?: string
): Promise<Match[]> => {
  const params = new URLSearchParams();
  if (seasonId) params.append('seasonId', seasonId);
  if (teamId) params.append('teamId', teamId);
  if (playerSteamId) params.append('playerSteamId', playerSteamId);

  const queryString = params.toString();
  const endpoint = queryString ? `matches?${queryString}` : 'matches';
  const response = await axiosInstance.get<Match[]>(endpoint);
  return response.data;
};
```

**4.5 Update Queries.tsx**
```typescript
// D:\git\IDLWebApp\frontend\src\services\Queries.tsx
export function useFilteredMatches(
  seasonId?: string,
  teamId?: string,
  playerSteamId?: string
) {
  return useQuery({
    queryKey: ["matches", seasonId, teamId, playerSteamId],
    queryFn: () => getFilteredMatches(seasonId, teamId, playerSteamId),
  });
}
```

**Files Modified:**
- `backend/repository/MatchRepository.java`
- `backend/service/MatchService.java`
- `backend/controller/MatchController.java`
- `frontend/src/services/Api.tsx`
- `frontend/src/services/Queries.tsx`

---

### PHASE 5: Seasonal Leaderboard

**5.1 Create SeasonalPlayerStatsResponse**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\dto\response\player\SeasonalPlayerStatsResponse.java
package com.plainoldmoose.IDLWebApp.dto.response.player;

import java.util.UUID;

public record SeasonalPlayerStatsResponse(
    String steamId,
    String username,
    Long currentElo,
    UUID seasonId,
    String seasonName,
    int matchesPlayed,
    int wins,
    int losses,
    double winRate,
    Long avgEloChange,
    int rank
) {}
```

**5.2 Update PlayerService**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\service\PlayerService.java
public List<SeasonalPlayerStatsResponse> getPlayersBySeasonRanked(UUID seasonId) {
    Season season = seasonRepository.findById(seasonId)
        .orElseThrow(() -> new RuntimeException("Season not found"));

    // Get all players who participated in this season
    List<Player> players = playerRepository.findAll();

    List<SeasonalPlayerStatsResponse> stats = players.stream()
        .map(player -> calculateSeasonalStats(player, season))
        .filter(stat -> stat.matchesPlayed() > 0)  // Only include players who played
        .sorted((a, b) -> Long.compare(b.currentElo(), a.currentElo()))
        .toList();

    // Add ranks
    List<SeasonalPlayerStatsResponse> rankedStats = new ArrayList<>();
    for (int i = 0; i < stats.size(); i++) {
        SeasonalPlayerStatsResponse stat = stats.get(i);
        rankedStats.add(new SeasonalPlayerStatsResponse(
            stat.steamId(),
            stat.username(),
            stat.currentElo(),
            stat.seasonId(),
            stat.seasonName(),
            stat.matchesPlayed(),
            stat.wins(),
            stat.losses(),
            stat.winRate(),
            stat.avgEloChange(),
            i + 1  // Rank
        ));
    }

    return rankedStats;
}

private SeasonalPlayerStatsResponse calculateSeasonalStats(Player player, Season season) {
    // Get all elo history entries for this season
    List<EloHistory> seasonHistory = player.getEloHistory().stream()
        .filter(eh -> eh.getMatch() != null &&
                     eh.getMatch().getSeason().getId().equals(season.getId()))
        .toList();

    int wins = (int) seasonHistory.stream()
        .filter(eh -> eh.getReason() == EloChangeReason.MATCH_WIN)
        .count();

    int losses = (int) seasonHistory.stream()
        .filter(eh -> eh.getReason() == EloChangeReason.MATCH_LOSS)
        .count();

    int matchesPlayed = wins + losses;
    double winRate = matchesPlayed > 0 ? (wins * 100.0) / matchesPlayed : 0.0;

    Long avgEloChange = seasonHistory.stream()
        .mapToLong(EloHistory::getEloChange)
        .average()
        .orElse(0.0)
        .longValue();

    return new SeasonalPlayerStatsResponse(
        player.getSteamId(),
        player.getUsername(),
        player.getElo(),
        season.getId(),
        season.getName(),
        matchesPlayed,
        wins,
        losses,
        winRate,
        avgEloChange,
        0  // Rank added later
    );
}
```

**5.3 Update PlayerController**
```java
// D:\git\IDLWebApp\backend\src\main\java\com\plainoldmoose\IDLWebApp\controller\PlayerController.java
@GetMapping("/by-season/{seasonId}")
public List<SeasonalPlayerStatsResponse> getPlayersBySeasonRanked(@PathVariable UUID seasonId) {
    return playerService.getPlayersBySeasonRanked(seasonId);
}
```

**5.4 Update Frontend Types**
```typescript
// D:\git\IDLWebApp\frontend\src\types\Player.tsx
export interface SeasonalPlayerStats {
  steamId: string;
  username: string;
  currentElo: number;
  seasonId: string;
  seasonName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  avgEloChange: number;
  rank: number;
}
```

**5.5 Update Api.tsx and Queries.tsx**
```typescript
// D:\git\IDLWebApp\frontend\src\services\Api.tsx
export const getSeasonalLeaderboard = async (seasonId: string): Promise<SeasonalPlayerStats[]> => {
  const response = await axiosInstance.get<SeasonalPlayerStats[]>(`players/by-season/${seasonId}`);
  return response.data;
};

// D:\git\IDLWebApp\frontend\src\services\Queries.tsx
export function useSeasonalLeaderboard(seasonId: string | undefined) {
  return useQuery({
    queryKey: ["leaderboard", "season", seasonId],
    queryFn: () => getSeasonalLeaderboard(seasonId!),
    enabled: !!seasonId,
  });
}
```

**Files Created:**
- `backend/dto/response/player/SeasonalPlayerStatsResponse.java`

**Files Modified:**
- `backend/service/PlayerService.java`
- `backend/controller/PlayerController.java`
- `frontend/src/types/Player.tsx`
- `frontend/src/services/Api.tsx`
- `frontend/src/services/Queries.tsx`

---

## Verification & Testing

### Backend Testing

**1. Type Fixes Verification**
```bash
# Test SeasonSummaryResponse returns enum
curl http://localhost:8080/api/seasons | jq '.[0].status'
# Should return: "ACTIVE" (not in quotes in JSON implies enum)

# Test RecentMatchResponse eloChange is Long
curl http://localhost:8080/api/players/76561198090941991 | jq '.recentMatches[0].eloChange'
# Should handle large values without overflow
```

**2. Match Details Verification**
```bash
# Get match detail with all participants
curl http://localhost:8080/api/matches/8652158440 | jq '.participants | length'
# Should return: 10 (all participants)

# Check participant data structure
curl http://localhost:8080/api/matches/8652158440 | jq '.participants[0]'
# Should include: steamId, username, currentElo, side, eloChange, isSub, subbingFor fields
```

**3. Team Roster Verification**
```bash
# Get season with teams including members
curl http://localhost:8080/api/seasons/f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454 | jq '.teams[0]'
# Should include: teamId, teamName, captain info, members array, stats

# Check members array
curl http://localhost:8080/api/seasons/f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454 | jq '.teams[0].members | length'
# Should return: 5 (expected team size)
```

**4. Match Filtering Verification**
```bash
# Filter by season
curl http://localhost:8080/api/matches?seasonId=f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454 | jq 'length'

# Filter by team
curl http://localhost:8080/api/matches?teamId=f8c3de3d-1fea-4d7c-a8b0-29f63c4c1111 | jq 'length'

# Filter by player
curl http://localhost:8080/api/matches?playerSteamId=76561198090941991 | jq 'length'

# Combined filters
curl "http://localhost:8080/api/matches?seasonId=f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454&teamId=f8c3de3d-1fea-4d7c-a8b0-29f63c4c1111" | jq 'length'
```

**5. Seasonal Leaderboard Verification**
```bash
# Get seasonal rankings
curl http://localhost:8080/api/players/by-season/f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454 | jq '.[0]'
# Should include: rank, seasonal stats, avgEloChange

# Verify ranking order
curl http://localhost:8080/api/players/by-season/f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454 | jq '.[0].rank'
# Should return: 1

# Check top 3 are sorted by ELO
curl http://localhost:8080/api/players/by-season/f8c3de3d-1fea-4d7c-a8b0-29f63c4c3454 | jq '.[0:3] | map(.currentElo)'
# Should be descending order
```

### Frontend Testing

**1. Type Safety**
- Import updated types in pages/components
- TypeScript should compile without errors
- No `any` types being inferred

**2. Match Detail Page**
- Navigate to `/matches/{matchId}`
- Should display all 10 participants
- Sub players should show "Subbing for {username}"
- ELO changes should be color-coded (green positive, red negative)

**3. Enhanced Leaderboard**
- Add season selector dropdown
- When season selected, call `useSeasonalLeaderboard(seasonId)`
- Display seasonal rankings with rank column
- Show seasonal stats (matches played, win rate for that season)

**4. Match Filtering**
- Add filter controls to Matches page
- Season dropdown, Team dropdown, Player search
- Matches should update when filters change
- Clear filters button resets to all matches

**5. Team Display**
- On Season detail page, click a team
- Should show team roster with all members
- Captain should be highlighted
- Team stats (wins, losses, win rate) displayed

### Database Verification

**Check TeamMember table exists**
```sql
SELECT * FROM team_member LIMIT 5;
-- Should show team roster data
```

**Verify team has members**
```sql
SELECT t.name, COUNT(tm.id) as member_count
FROM team t
LEFT JOIN team_member tm ON t.team_id = tm.team_id
GROUP BY t.team_id, t.name;
-- Each team should have 5 members
```

**Check participant data**
```sql
SELECT m.match_id, COUNT(mp.id) as participant_count
FROM matches m
LEFT JOIN match_participant mp ON m.match_id = mp.match_id
GROUP BY m.match_id;
-- Each match should have 10 participants
```

### Integration Testing

**End-to-End Flow:**
1. Navigate to Seasons page
2. Select a season (Season 1)
3. View season detail with teams
4. Click on leaderboard, filter by selected season
5. See ranked players for that season
6. Click on a player → see their profile
7. Click on a recent match → see match detail with all 10 players
8. Navigate to Matches page
9. Filter matches by the same season
10. All matches should be for Season 1

**Expected Results:**
- No 404 errors
- No type mismatches in console
- Data loads smoothly with React Query
- Loading states displayed properly
- Error handling for invalid IDs

---

## Critical Files Summary

### Backend Files to Create (8 files)
1. `backend/model/TeamMember.java`
2. `backend/repository/TeamMemberRepository.java`
3. `backend/dto/response/match/ParticipantResponse.java`
4. `backend/dto/response/match/MatchDetailResponse.java`
5. `backend/dto/response/team/TeamMemberResponse.java`
6. `backend/dto/response/player/SeasonalPlayerStatsResponse.java`
7. `backend/service/TeamService.java` (if doesn't exist)
8. Database migration for `team_member` table

### Backend Files to Modify (11 files)
1. `backend/dto/response/season/SeasonSummaryResponse.java`
2. `backend/dto/response/player/RecentMatchResponse.java`
3. `backend/dto/response/team/TeamResponse.java`
4. `backend/model/Team.java`
5. `backend/repository/MatchRepository.java`
6. `backend/service/MatchService.java`
7. `backend/service/PlayerService.java`
8. `backend/service/SeasonService.java`
9. `backend/controller/MatchController.java`
10. `backend/controller/PlayerController.java`
11. `backend/src/main/resources/data.sql`

### Frontend Files to Create (1 file)
1. `frontend/src/types/Team.tsx`

### Frontend Files to Modify (5 files)
1. `frontend/src/types/Season.tsx`
2. `frontend/src/types/Player.tsx`
3. `frontend/src/types/Match.tsx`
4. `frontend/src/services/Api.tsx`
5. `frontend/src/services/Queries.tsx`

**Total: 25 files (9 new, 16 modified)**

---

## Implementation Notes

### Ordering Dependencies
1. Phase 1 has no dependencies - can start immediately
2. Phase 2 depends on Phase 1 (type fixes should be done first)
3. Phase 3 requires database migration before DTO work
4. Phase 4 can be done in parallel with Phase 3
5. Phase 5 can be done in parallel with Phase 3-4

### Suggested Work Order
1. Phase 1 (1-2 hours) - foundational fixes
2. Phase 3A - Database schema (1 hour) - unblocks Phase 3B
3. Phase 2 (3-4 hours) - while waiting for DB migration in dev
4. Phase 3B (3-4 hours) - after DB is ready
5. Phase 4 (2-3 hours) - parallel with Phase 5
6. Phase 5 (4-5 hours) - complex, do last

### Potential Issues to Watch
- **N+1 Queries**: Participant and member loading could cause performance issues
  - Solution: Use `@EntityGraph` or JOIN FETCH in queries
- **Empty Members List**: Teams created before migration will have no members
  - Solution: Ensure data.sql includes all team rosters
- **Frontend Type Mismatches**: New fields might not match exactly
  - Solution: Test API responses in Postman/curl before frontend work
- **React Query Cache**: Changing API contracts may cause stale data
  - Solution: Clear cache or increment API version in query keys
