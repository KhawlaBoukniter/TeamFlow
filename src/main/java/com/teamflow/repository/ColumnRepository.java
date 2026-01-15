package com.teamflow.repository;

import com.teamflow.entity.ProjectColumn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ColumnRepository extends JpaRepository<ProjectColumn, Long> {
}
