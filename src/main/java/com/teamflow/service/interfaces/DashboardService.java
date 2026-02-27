package com.teamflow.service.interfaces;

import java.util.List;

import com.teamflow.dto.DashboardDTO;
import com.teamflow.dto.TaskDTO;

public interface DashboardService {
    DashboardDTO getStats();

    List<TaskDTO> getMyActiveTasks();
}
