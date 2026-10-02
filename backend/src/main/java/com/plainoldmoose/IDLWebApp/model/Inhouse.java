package com.plainoldmoose.IDLWebApp.model;

import com.plainoldmoose.IDLWebApp.model.enums.Side;
import com.plainoldmoose.IDLWebApp.model.player.Player;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * An in-house whose result isn't approved yet. Deleted once an admin approves the result and it becomes a match.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
public class Inhouse {
    // Becomes the match's ID; Postgres never hands out an identity value twice, so deleted rows can't clash
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToMany
    @JoinTable(name = "inhouse_radiant")
    private List<Player> radiant = new ArrayList<>();

    @ManyToMany
    @JoinTable(name = "inhouse_dire")
    private List<Player> dire = new ArrayList<>();

    // When the teams were picked, so roughly when the game started
    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Who someone says won, waiting for an admin to approve. Null while the game is still on
    @Enumerated(EnumType.STRING)
    private Side reportedWinner;

    @ManyToOne
    private Player reportedBy;

    // Two results sent at once: the second delete finds a newer version, so it rolls back instead of adding ELO twice
    @Version
    private long version;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
