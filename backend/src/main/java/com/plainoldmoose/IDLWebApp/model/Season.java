package com.plainoldmoose.IDLWebApp.model;

import com.plainoldmoose.IDLWebApp.model.enums.SeasonStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@NoArgsConstructor
@Getter
@Setter
public class Season {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SeasonStatus status = SeasonStatus.REGISTRATION;

    private LocalDate startDate;
    private LocalDate endDate;

    // Sign-ups go with the season; teams and matches block deleting it instead
    @OneToMany(mappedBy = "season", cascade = CascadeType.REMOVE)
    private List<SeasonSignup> signups;

    @OneToMany(mappedBy = "season")
    private List<Team> teams;

    @ManyToOne
    @JoinColumn(name = "winner_team_id")
    private Team winner;
}
