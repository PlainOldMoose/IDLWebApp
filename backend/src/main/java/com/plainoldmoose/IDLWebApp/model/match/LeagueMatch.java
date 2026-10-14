package com.plainoldmoose.IDLWebApp.model.match;

import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.enums.LeagueMatchStatus;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A game the league sync found on a season's ticket. Pending ones wait in the admin queue with what OpenDota said
 * about them; imported and rejected ones only stop the game being picked up again.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "league_matches")
public class LeagueMatch {
    // Dota's match ID, the same one the match gets once imported
    @Id
    private Long matchId;

    @ManyToOne
    @JoinColumn(name = "season_id", nullable = false)
    private Season season;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeagueMatchStatus status;

    @Column(nullable = false)
    private LocalDateTime playedTime;

    @Enumerated(EnumType.STRING)
    private Side winner;

    // The sync's guess at each side's team; null when no team has a majority of that side
    @ManyToOne
    @JoinColumn(name = "radiant_team_id")
    private Team radiantTeam;

    @ManyToOne
    @JoinColumn(name = "dire_team_id")
    private Team direTeam;

    // Steam IDs of each side's public profiles, registered or not. Private profiles are only counted, in the reason
    @ElementCollection
    @CollectionTable(name = "league_match_radiant")
    @Column(name = "steam_id", length = 17)
    private List<String> radiant = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "league_match_dire")
    @Column(name = "steam_id", length = 17)
    private List<String> dire = new ArrayList<>();

    // Why it couldn't go in on its own
    private String reason;
}
