package com.plainoldmoose.IDLWebApp.model.match;

import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "matches")
public class Match {
    @Id
    private Long matchId;

    // No season means an in-house match
    @ManyToOne
    @JoinColumn(name = "season_id")
    private Season season;

    @ManyToOne
    @JoinColumn(name="radiant_team_id")
    private Team radiantTeam;

    @ManyToOne
    @JoinColumn(name="dire_team_id")
    private Team direTeam;

    @Column(nullable = false)
    private LocalDateTime playedTime;

    @Enumerated(EnumType.STRING)
    private Side matchWinner;

    // null for the old sheet's games that don't have all 10 players' ELO; the ELO replay sets it for every other game
    private Integer avgElo;

    @OneToMany(mappedBy = "match", cascade = CascadeType.ALL)
    private List<MatchParticipant> participants;

    // A team didn't show: the forfeiting team is Radiant and loses. Counts in the season table only, never for ELO
    @ColumnDefault("false")
    @Column(nullable = false)
    private boolean forfeit;
}
