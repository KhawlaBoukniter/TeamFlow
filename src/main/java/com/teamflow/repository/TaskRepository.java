package com.teamflow.repository;

import com.teamflow.entity.Task;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByColumn_Id(Long columnId);

    List<Task> findByColumn_Project_IdAndDeletedAtIsNull(Long projectId);



    @Query("SELECT t FROM Task t JOIN t.assignments a WHERE a.user.id = :userId AND t.deletedAt IS NULL ORDER BY t.dueDate ASC")
    List<Task> findActiveTasksByUserId(@Param("userId") Long userId);

    @Query("SELECT DISTINCT t FROM Task t LEFT JOIN t.column c LEFT JOIN c.project p LEFT JOIN p.memberships m " +
            "WHERE t.deletedAt IS NULL AND " +
            "(t.title LIKE %:query% OR t.description LIKE %:query%) AND " +
            "(p.owner.id = :userId OR (m.user.id = :userId AND m.deletedAt IS NULL))")
    List<Task> searchTasks(@Param("query") String query, @Param("userId") Long userId);
}
