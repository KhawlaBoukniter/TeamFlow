package com.teamflow.service.interfaces;

import com.teamflow.dto.SubTaskDTO;
import java.util.List;

public interface SubTaskService {
    List<SubTaskDTO> getSubTasksByTaskId(Long taskId);

    SubTaskDTO createSubTask(Long taskId, SubTaskDTO dto);

    SubTaskDTO updateSubTask(Long id, SubTaskDTO dto);

    void deleteSubTask(Long id);
}
