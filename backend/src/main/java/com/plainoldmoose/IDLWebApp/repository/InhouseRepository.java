package com.plainoldmoose.IDLWebApp.repository;

import com.plainoldmoose.IDLWebApp.model.Inhouse;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InhouseRepository extends JpaRepository<Inhouse, Long> {
    List<Inhouse> findAllByReportedWinnerIsNullOrderByCreatedAtDesc();
    List<Inhouse> findAllByReportedWinnerIsNotNullOrderByCreatedAtAsc();
}
