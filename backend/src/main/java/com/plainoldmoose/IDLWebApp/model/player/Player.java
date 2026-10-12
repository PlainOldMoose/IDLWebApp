package com.plainoldmoose.IDLWebApp.model.player;

import com.plainoldmoose.IDLWebApp.model.match.MatchParticipant;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@NoArgsConstructor
@Getter
@Setter
public class Player {
    @Id
    @Column(length = 17)
    private String steamId;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private double elo;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    // Read on every signed-in request, so granting or revoking applies straight away
    @ColumnDefault("false")
    @Column(nullable = false)
    private boolean admin;

    @OneToMany(mappedBy = "player")
    private List<EloHistory> eloHistory;

    @OneToMany(mappedBy = "player")
    private List<MatchParticipant> matchParticipations;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
