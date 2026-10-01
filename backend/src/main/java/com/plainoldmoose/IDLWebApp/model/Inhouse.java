package com.plainoldmoose.IDLWebApp.model;

import com.plainoldmoose.IDLWebApp.model.player.Player;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * An in-house whose teams are picked but whose result isn't in yet. Deleted once the result turns it into a match.
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

    // Two results sent at once: the second delete finds a newer version, so it rolls back instead of adding ELO twice
    @Version
    private long version;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
