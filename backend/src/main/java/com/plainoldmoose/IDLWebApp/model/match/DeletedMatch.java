package com.plainoldmoose.IDLWebApp.model.match;

import com.plainoldmoose.IDLWebApp.model.Season;
import com.plainoldmoose.IDLWebApp.model.Team;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * A deleted match, kept for a week so an admin can put it back. Holds what MatchService.create needs to add it again;
 * its ELO history goes with the match and is worked out afresh on restore.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "deleted_matches")
public class DeletedMatch {
    @Id
    private Long matchId;

    @ManyToOne
    @JoinColumn(name = "season_id", nullable = false)
    private Season season;

    @Column(nullable = false)
    private LocalDateTime playedTime;

    @Enumerated(EnumType.STRING)
    private Side winner;

    @ManyToOne
    @JoinColumn(name = "radiant_team_id")
    private Team radiantTeam;

    @ManyToOne
    @JoinColumn(name = "dire_team_id")
    private Team direTeam;

    @Column(nullable = false)
    private LocalDateTime deletedAt;

    @ColumnDefault("false")
    @Column(nullable = false)
    private boolean forfeit;

    @ElementCollection
    @CollectionTable(name = "deleted_match_participants")
    private List<DeletedParticipant> participants = new ArrayList<>();

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    public static class DeletedParticipant {
        @Column(length = 17)
        private String steamId;

        @Enumerated(EnumType.STRING)
        private Side side;

        // The team member a sub stood in for; null when it isn't known or they weren't a sub
        @Column(length = 17)
        private String subbingFor;
    }
}
