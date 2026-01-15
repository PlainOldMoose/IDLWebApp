package com.plainoldmoose.IDLWebApp.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Player {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private Long elo;

    @Column(unique = true)
    private String SteamId;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "player")
    private List<EloHistory> eloHistory;

    @OneToMany(mappedBy = "player")
    private List<MatchParticipant> matchParticipations;

    @OneToMany(mappedBy = "player")
    private List<TeamPlayer> teamMemberships;
}
