package com.teamflow.service.interfaces;

import com.teamflow.dto.ProjectDTO;
import com.teamflow.dto.TaskDTO;
import java.util.List;

public interface CsvExportService {
    byte[] exportProjectsToCsv(List<ProjectDTO> projects);

    byte[] exportTasksToCsv(List<TaskDTO> tasks);
}
