package com.plainoldmoose.IDLWebApp.model;

import jakarta.persistence.*;

import java.util.List;

@Entity
public class Team {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne
    @JoinColumn(name = "season_id", nullable = false)
    private Season season;

    private Long totalElo;

    private int wins;
    private int losses;

    @OneToMany(mappedBy = "team")
    private List<TeamPlayer> teamPlayers;
}
