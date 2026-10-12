package com.plainoldmoose.IDLWebApp.model;

import com.plainoldmoose.IDLWebApp.model.player.Player;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.function.ToIntFunction;

@Entity
@Getter
@Setter
@NoArgsConstructor
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
    private int avgElo;

    @Column(columnDefinition = "integer default 0")
    private int wins;

    @Column(columnDefinition = "integer default 0")
    private int losses;

    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL)
    private List<TeamMember> members = new ArrayList<>();

    // The season table's order: most wins, then fewest losses. Sorts are stable, so ties keep the season's own team order
    public static <T> Comparator<T> tableOrder(ToIntFunction<T> wins, ToIntFunction<T> losses) {
        return Comparator.comparingInt(wins).reversed().thenComparingInt(losses);
    }
}
