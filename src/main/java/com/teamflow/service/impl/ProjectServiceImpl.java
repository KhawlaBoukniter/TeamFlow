package com.teamflow.service.impl;

import com.teamflow.dto.MembershipDTO;
import com.teamflow.dto.ProjectDTO;
import com.teamflow.entity.Membership;
import com.teamflow.entity.Project;
import com.teamflow.entity.ProjectColumn;
import com.teamflow.entity.User;
import com.teamflow.entity.enums.RoleInProject;
import com.teamflow.exception.AccessDeniedException;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.ColumnRepository;
import com.teamflow.repository.MembershipRepository;
import com.teamflow.repository.ProjectRepository;
import com.teamflow.security.SecurityUtils;
import com.teamflow.service.interfaces.AuditLogService;
import com.teamflow.service.interfaces.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final ColumnRepository columnRepository;
    private final MembershipRepository membershipRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public List<ProjectDTO> getAllProjects() {
        User currentUser = SecurityUtils.getCurrentUser();

        List<Project> projects;
        if (currentUser.isAdmin()) {
            projects = projectRepository.findAll().stream()
                    .filter(p -> p.getDeletedAt() == null)
                    .collect(Collectors.toList());
        } else {
            projects = projectRepository.findProjectsByUserAccess(currentUser.getId());
        }

        return projects.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("@projectSecurity.isMember(#id)")
    public ProjectDTO getProjectById(Long id) {
        Project project = findProjectOrThrow(id);
        return toDTO(project);
    }

    @Override
    @Transactional
    public ProjectDTO createProject(ProjectDTO dto) {
        User currentUser = SecurityUtils.getCurrentUser();

        Project project = new Project();
        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        project.setStatus(dto.getStatus());
        project.setType(dto.getType());
        project.setOwner(currentUser);

        Project savedProject = projectRepository.save(project);

        createDefaultColumns(savedProject);

        Membership ownerMembership = new Membership();
        ownerMembership.setProject(savedProject);
        ownerMembership.setUser(currentUser);
        ownerMembership.setRoleInProject(RoleInProject.MANAGER);
        ownerMembership.setJoinedAt(LocalDateTime.now());
        membershipRepository.save(ownerMembership);

        auditLogService.logAction("CREATE", "Project", savedProject.getId(), "Created project: " + dto.getName());

        return toDTO(savedProject);
    }

    @Override
    @Transactional
    @PreAuthorize("@projectSecurity.isManager(#id)")
    public ProjectDTO updateProject(Long id, ProjectDTO dto) {
        Project project = findProjectOrThrow(id);

        project.setName(dto.getName());
        project.setDescription(dto.getDescription());
        project.setStartDate(dto.getStartDate());
        project.setEndDate(dto.getEndDate());
        if (dto.getStatus() != null) {
            project.setStatus(dto.getStatus());
        }

        Project updatedProject = projectRepository.save(project);
        auditLogService.logAction("UPDATE", "Project", updatedProject.getId(), "Updated project details");
        return toDTO(updatedProject);
    }

    @Override
    @Transactional
    @PreAuthorize("@projectSecurity.isManager(#id)")
    public void deleteProject(Long id) {
        Project project = findProjectOrThrow(id);

        project.setDeletedAt(LocalDateTime.now());
        projectRepository.save(project);
        auditLogService.logAction("DELETE", "Project", project.getId(), "Project archived/deleted");
    }

    private Project findProjectOrThrow(Long id) {
        return projectRepository.findById(id)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + id));
    }

    private void createDefaultColumns(Project project) {
        String[] defaultColumns = { "To Do", "In Progress", "Done" };
        for (int i = 0; i < defaultColumns.length; i++) {
            ProjectColumn column = new ProjectColumn();
            column.setName(defaultColumns[i]);
            column.setOrderIndex(i);
            column.setProject(project);
            if ("Done".equalsIgnoreCase(defaultColumns[i])) {
                column.setFinal(true);
            }
            columnRepository.save(column);
        }
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

        if (project.getOwner() != null) {
            dto.setOwnerId(project.getOwner().getId());
            dto.setOwnerEmail(project.getOwner().getEmail());
        }

        long totalTasks = project.getColumns().stream()
                .flatMap(col -> col.getTasks().stream())
                .filter(t -> t.getDeletedAt() == null)
                .count();

        long completedTasks = project.getColumns().stream()
                .filter(col -> "Done".equalsIgnoreCase(col.getName()))
                .flatMap(col -> col.getTasks().stream())
                .filter(t -> t.getDeletedAt() == null)
                .count();

        dto.setTotalTasks(totalTasks);
        dto.setCompletedTasks(completedTasks);
        dto.setProgress(totalTasks > 0 ? (double) completedTasks / totalTasks * 100 : 0);

        List<MembershipDTO> team = project.getMemberships().stream()
                .filter(m -> m.getDeletedAt() == null)
                .limit(3)
                .map(m -> {
                    MembershipDTO mdto = new MembershipDTO();
                    mdto.setId(m.getId());
                    mdto.setUserId(m.getUser().getId());
                    mdto.setUserName(m.getUser().getFullName());
                    mdto.setUserEmail(m.getUser().getEmail());
                    mdto.setRoleInProject(m.getRoleInProject());
                    mdto.setProjectId(project.getId());
                    return mdto;
                })
                .collect(Collectors.toList());
        dto.setTeam(team);

        return dto;
    }
}
