package com.plainoldmoose.IDLWebApp.model.player;

public record EloSnapshot(Long matchId,
                          double eloDuringMatch) {
}
