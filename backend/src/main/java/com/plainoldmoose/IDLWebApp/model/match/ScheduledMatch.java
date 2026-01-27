package com.plainoldmoose.IDLWebApp.model.match;

import com.plainoldmoose.IDLWebApp.model.Team;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class ScheduledMatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "team_a_id")
    private Team teamA;

    @ManyToOne(optional = false)
    @JoinColumn(name = "team_b_id")
    private Team teamB;

    @Column(nullable = false)
    private LocalDateTime scheduledTime;
}
