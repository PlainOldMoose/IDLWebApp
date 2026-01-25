package com.plainoldmoose.IDLWebApp.model;

import com.plainoldmoose.IDLWebApp.model.enums.EloChangeReason;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Setter
@Getter
public class EloHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "player_id")
    private Player player;

    @ManyToOne
    @JoinColumn(name = "match_id")
    private Match match;

    // Elo after change
    @Column(nullable = false)
    private int elo;

    @Column(nullable = false)
    private int eloChange;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Enumerated
    private EloChangeReason reason;
}
