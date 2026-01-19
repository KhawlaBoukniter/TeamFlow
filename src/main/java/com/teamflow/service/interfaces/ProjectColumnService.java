package com.teamflow.service.interfaces;

import com.teamflow.dto.ProjectColumnDTO;
import java.util.List;

public interface ProjectColumnService {
    List<ProjectColumnDTO> getColumnsByProjectId(Long projectId);

    ProjectColumnDTO getColumnById(Long id);

    ProjectColumnDTO createColumn(Long projectId, ProjectColumnDTO dto);

    ProjectColumnDTO updateColumn(Long id, ProjectColumnDTO dto);

    void deleteColumn(Long id);
}
