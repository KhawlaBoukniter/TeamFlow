package com.teamflow.service.interfaces;

import com.teamflow.dto.TaskAssignmentDTO;
import java.util.List;

public interface TaskAssignmentService {
    List<TaskAssignmentDTO> getAssignmentsByTaskId(Long taskId);

    TaskAssignmentDTO assignUserToTask(TaskAssignmentDTO dto);

    TaskAssignmentDTO updateAssignmentRole(Long id, TaskAssignmentDTO dto);

    void removeAssignment(Long id);
}
