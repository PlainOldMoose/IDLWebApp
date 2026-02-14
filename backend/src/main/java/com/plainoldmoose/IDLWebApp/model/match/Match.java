package com.plainoldmoose.IDLWebApp.model.match;

import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.enums.MatchStatus;
import com.plainoldmoose.IDLWebApp.model.enums.MatchType;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
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
    @Min(value = 1, message = "Match ID must be positive")
    private Long matchId;

    @Enumerated
    private MatchType matchType;

    @ManyToOne
    @JoinColumn(name = "season_id")
    private Season season;

    @ManyToOne
    @JoinColumn(name="radiant_team_id")
    private Team radiantTeam;

    @ManyToOne
    @JoinColumn(name="dire_team_id")
    private Team direTeam;

    private LocalDateTime scheduledTime;

    private LocalDateTime playedTime;

    @Enumerated
    private MatchStatus status;

    // TODO - think about this
    @Enumerated
    private Side matchWinner;

    private int avgElo;

    @OneToMany(mappedBy = "match")
    private List<MatchParticipant> participants;
}
