package com.plainoldmoose.IDLWebApp.model;

import com.plainoldmoose.IDLWebApp.model.enums.Side;
import jakarta.annotation.Nullable;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
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

    private Boolean isSub;

    @ManyToOne
    @Nullable
    private Player subbingFor;
}
