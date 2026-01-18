package com.plainoldmoose.IDLWebApp.model;

import com.plainoldmoose.IDLWebApp.model.enums.MatchStatus;
import com.plainoldmoose.IDLWebApp.model.enums.MatchType;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
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
    private Season season;

    @ManyToOne
    private Team radiantTeam;

    @ManyToOne
    private Team direTeam;

    private LocalDateTime scheduledTime;

    private LocalDateTime playedTime;

    @Enumerated
    private MatchStatus status;

    // TODO - think about this
    @Enumerated
    private Side matchWinner;

    private Long avgElo;

    @OneToMany(mappedBy = "match")
    private List<MatchParticipant> participants;
}
