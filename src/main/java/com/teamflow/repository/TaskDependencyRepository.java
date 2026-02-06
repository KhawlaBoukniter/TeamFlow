package com.teamflow.repository;

import com.teamflow.entity.TaskDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TaskDependencyRepository extends JpaRepository<TaskDependency, Long> {
    java.util.List<TaskDependency> findByDependentId(Long dependentId);

    java.util.List<TaskDependency> findByPrerequisiteId(Long prerequisiteId);

    java.util.Optional<TaskDependency> findByDependentIdAndPrerequisiteId(Long dependentId, Long prerequisiteId);

    boolean existsByDependentIdAndPrerequisiteId(Long dependentId, Long prerequisiteId);
}
