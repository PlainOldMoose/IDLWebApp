package com.plainoldmoose.IDLWebApp.model.match;

import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

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

    private LocalDateTime playedTime;

    @Enumerated(EnumType.STRING)
    private Side matchWinner;

    private int avgElo;

    @OneToMany(mappedBy = "match")
    private List<MatchParticipant> participants;
}
