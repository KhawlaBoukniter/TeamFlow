package com.teamflow.service.impl;

import com.teamflow.dto.ProjectDTO;
import com.teamflow.entity.Project;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.ProjectRepository;
import com.teamflow.service.interfaces.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final com.teamflow.repository.ColumnRepository columnRepository;
    private final com.teamflow.repository.TaskRepository taskRepository;
    private final com.teamflow.repository.MembershipRepository membershipRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAll().stream()
                .filter(p -> p.getDeletedAt() == null)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDTO getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
        return toDTO(project);
    }

    @Override
    @Transactional
    public ProjectDTO createProject(ProjectDTO dto) {
        Project project = new Project();
        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        project.setStatus(dto.getStatus());
        project.setType(dto.getType());

        Project savedProject = projectRepository.save(project);

        createDefaultColumn(savedProject, "To Do", 0);
        createDefaultColumn(savedProject, "In Progress", 1);
        createDefaultColumn(savedProject, "Done", 2);

        return toDTO(savedProject);
    }

    private void createDefaultColumn(Project project, String name, int order) {
        com.teamflow.entity.ProjectColumn column = new com.teamflow.entity.ProjectColumn();
        column.setName(name);
        column.setOrderIndex(order);
        column.setProject(project);
        columnRepository.save(column);
    }

    @Override
    @Transactional
    public ProjectDTO updateProject(Long id, ProjectDTO dto) {
        Project project = projectRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        project.setStatus(dto.getStatus());

        Project updatedProject = projectRepository.save(project);
        return toDTO(updatedProject);
    }

    @Override
    @Transactional
    public void deleteProject(Long id) {
        Project project = projectRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));

        project.setDeletedAt(LocalDateTime.now());
        projectRepository.save(project);
    }

    private ProjectDTO toDTO(Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setStartDate(project.getStartDate());
        dto.setEndDate(project.getEndDate());
        dto.setStatus(project.getStatus());
        dto.setType(project.getType());
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());

        long totalTasks = 0;
        long completedTasks = 0;

        java.util.List<com.teamflow.entity.Membership> members = membershipRepository.findByProjectId(project.getId());
        dto.setTeam(members.stream()
                .limit(3)
                .map(m -> {
                    com.teamflow.dto.MembershipDTO memDto = new com.teamflow.dto.MembershipDTO();
                    memDto.setId(m.getId());
                    memDto.setUserName(m.getUser().getFullName());
                    memDto.setUserEmail(m.getUser().getEmail());
                    memDto.setRoleInProject(m.getRoleInProject());
                    memDto.setUserId(m.getUser().getId());
                    return memDto;
                })
                .collect(java.util.stream.Collectors.toList()));

        totalTasks = taskRepository.countByColumn_Project_Id(project.getId());
        completedTasks = taskRepository.countByColumn_Project_IdAndColumn_Name(project.getId(), "Done");

        dto.setTotalTasks(totalTasks);
        dto.setCompletedTasks(completedTasks);
        dto.setProgress(totalTasks > 0 ? (double) completedTasks / totalTasks * 100.0 : 0.0);

        return dto;
    }
}
