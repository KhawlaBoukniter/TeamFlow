package com.teamflow.repository;

import com.teamflow.entity.TaskAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskAssignmentRepository extends JpaRepository<TaskAssignment, Long> {

    java.util.Optional<TaskAssignment> findByTask_IdAndUser_Id(Long taskId, Long userId);
}
