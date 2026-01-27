package com.plainoldmoose.IDLWebApp.model;

import com.plainoldmoose.IDLWebApp.model.player.Player;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Represents a team in a given season.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID teamId;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "season_id", nullable = false)
    private Season season;

    @ManyToOne
    @JoinColumn(name = "captain_id", nullable = false)
    private Player captain;

    @Column(columnDefinition = "integer default 0")
    private int avgElo = 0;

    @Column(columnDefinition = "integer default 0")
    private int wins = 0;

    @Column(columnDefinition = "integer default 0")
    private int losses = 0;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL)
    private List<TeamMember> members = new ArrayList<>();
}
