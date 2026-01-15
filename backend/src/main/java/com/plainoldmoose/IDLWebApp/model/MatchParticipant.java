package com.plainoldmoose.IDLWebApp.model;

import com.plainoldmoose.IDLWebApp.model.enums.Side;
import jakarta.annotation.Nullable;
import jakarta.persistence.*;

@Entity
public class MatchParticipant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Match match;

    @ManyToOne
    private Player player;

    @Enumerated
    private Side side;

    private Long eloBefore;

    private Long eloAfter;

    private Long eloChange;

    private Boolean isSub;

    @ManyToOne
    @Nullable
    private Player subbingFor;
}
