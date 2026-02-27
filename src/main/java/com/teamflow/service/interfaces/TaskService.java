package com.teamflow.service.interfaces;

import com.teamflow.dto.TaskAssignmentDTO;
import com.teamflow.dto.TaskDTO;
import java.util.List;

public interface TaskService {
    List<TaskDTO> getTasksByColumnId(Long columnId);

    TaskDTO getTaskById(Long id);

    TaskDTO createTask(Long columnId, TaskDTO dto);

    TaskDTO updateTask(Long id, TaskDTO dto);

    TaskDTO moveTask(Long taskId, Long targetColumnId);

    List<TaskDTO> getMyActiveTasks();

    TaskAssignmentDTO assignUserToTask(Long taskId, Long userId, String role);

    void removeAssignment(Long taskId, Long userId);

    void deleteTask(Long id);

    void addDependency(Long taskId, Long dependencyId);

    void removeDependency(Long taskId, Long dependencyId);
}
