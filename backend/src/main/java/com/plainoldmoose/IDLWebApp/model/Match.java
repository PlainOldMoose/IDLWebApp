package com.plainoldmoose.IDLWebApp.model;

import com.plainoldmoose.IDLWebApp.model.enums.MatchStatus;
import com.plainoldmoose.IDLWebApp.model.enums.MatchType;
import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import jakarta.annotation.Nullable;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
public class Match {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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

    @Enumerated
    private Side matchWinner;

    private Long avgElo;

    @OneToMany(mappedBy = "match")
    private List<MatchParticipant> participants;
}
