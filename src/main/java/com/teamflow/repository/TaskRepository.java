package com.teamflow.repository;

import com.teamflow.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    java.util.List<Task> findByColumn_Id(Long columnId);
}
