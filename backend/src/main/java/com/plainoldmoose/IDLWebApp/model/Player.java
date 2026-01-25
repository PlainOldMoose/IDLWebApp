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
    @Column(length = 17, unique = true, nullable = false)
    private String steamId;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private int elo;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "player")
    private List<EloHistory> eloHistory;

    @OneToMany(mappedBy = "player")
    private List<MatchParticipant> matchParticipations;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
