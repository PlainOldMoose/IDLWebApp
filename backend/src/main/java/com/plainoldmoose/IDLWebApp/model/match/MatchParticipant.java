package com.plainoldmoose.IDLWebApp.model.match;

import com.plainoldmoose.IDLWebApp.model.player.Player;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Setter
@Getter
public class MatchParticipant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "match_id")
    private Match match;

    @ManyToOne
    @JoinColumn(name = "player_id")
    private Player player;

    @Enumerated(EnumType.STRING)
    private Side side;

    private boolean isSub;

    @ManyToOne
    @JoinColumn(name = "subbing_for_id")
    private Player subbingFor;
}
