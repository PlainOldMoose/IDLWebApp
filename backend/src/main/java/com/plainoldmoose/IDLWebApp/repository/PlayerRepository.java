package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.player.Player;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PlayerRepository extends JpaRepository<Player, String> {
    List<Player> findAllByOrderByEloDesc();
    boolean existsByUsername(String username);
}
