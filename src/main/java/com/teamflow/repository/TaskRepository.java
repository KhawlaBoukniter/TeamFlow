package com.teamflow.repository;

import com.teamflow.entity.Task;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByColumn_Id(Long columnId);

    Long countByColumn_Project_Id(Long projectId);

    Long countByColumn_Project_IdAndColumn_Name(Long projectId, String columnName);

    @Query("SELECT t FROM Task t JOIN t.assignments a WHERE a.user.id = :userId AND (t.column IS NULL OR t.column.isFinal = false) AND t.deletedAt IS NULL ORDER BY t.dueDate ASC")
    List<Task> findActiveTasksByUserId(
            @org.springframework.data.repository.query.Param("userId") Long userId);
}
