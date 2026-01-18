package com.plainoldmoose.IDLWebApp.model;

import com.plainoldmoose.IDLWebApp.model.enums.EloChangeReason;
import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Setter
@Getter
public class EloHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Player player;

    @ManyToOne
    private Match match;

    // Elo after change
    @Column(nullable = false)
    private Long elo;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Enumerated
    private EloChangeReason reason;
}
