package com.plainoldmoose.IDLWebApp.model;

import com.plainoldmoose.IDLWebApp.model.player.Player;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"season_id", "player_id"})
})
public class SeasonSignup {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private long id;

    @ManyToOne
    @JoinColumn(name = "season_id", nullable = false)
    private Season season;

    @ManyToOne
    @JoinColumn(name = "player_id", nullable = false)
    private Player player;

    // Nullable: sign-ups from before role preferences existed have none
    private String rolePreference;

    @Column(nullable = false)
    private boolean willingToCaptain;

    @Column(nullable = false)
    private LocalDateTime signedUpAt;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean sub;

    @PrePersist
    public void prePersist() {
        signedUpAt = LocalDateTime.now();
    }
}
