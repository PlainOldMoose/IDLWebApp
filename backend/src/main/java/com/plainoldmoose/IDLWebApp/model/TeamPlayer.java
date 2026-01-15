package com.plainoldmoose.IDLWebApp.model;

import com.plainoldmoose.IDLWebApp.model.enums.TeamRole;
import jakarta.persistence.*;


@Entity
public class TeamPlayer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    private Team team;

    @ManyToOne
    private Player player;

    @Enumerated(EnumType.STRING)
    private TeamRole role;
}
