package com.teamflow.service.interfaces;

import com.teamflow.dto.TaskDTO;
import java.util.List;

public interface TaskService {
    List<TaskDTO> getTasksByColumnId(Long columnId);

    TaskDTO getTaskById(Long id);

    TaskDTO createTask(Long columnId, TaskDTO dto);

    TaskDTO updateTask(Long id, TaskDTO dto);

    TaskDTO moveTask(Long id, Long targetColumnId);

    void deleteTask(Long id);
}
