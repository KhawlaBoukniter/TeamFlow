package com.teamflow.service.interfaces;

import com.teamflow.dto.ProjectDTO;
import java.util.List;

public interface ProjectService {
    List<ProjectDTO> getAllProjects();

    ProjectDTO getProjectById(Long id);

    ProjectDTO createProject(ProjectDTO dto);

    ProjectDTO updateProject(Long id, ProjectDTO dto);

    void deleteProject(Long id);
}
