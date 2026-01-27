package com.plainoldmoose.IDLWebApp.model.match;

import com.plainoldmoose.IDLWebApp.model.Player;
import com.plainoldmoose.IDLWebApp.model.enums.Side;
import jakarta.annotation.Nullable;
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

    @Enumerated
    private Side side;

    private Boolean isSub;

    @ManyToOne
    @JoinColumn(name = "subbing_for_id")
    @Nullable
    private Player subbingFor;
}
