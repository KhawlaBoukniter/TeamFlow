package com.teamflow.security;

import com.teamflow.entity.Membership;
import com.teamflow.entity.Project;
import com.teamflow.entity.User;
import com.teamflow.entity.enums.RoleInProject;
import com.teamflow.repository.ColumnRepository;
import com.teamflow.repository.MembershipRepository;
import com.teamflow.repository.ProjectRepository;
import com.teamflow.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("projectSecurity")
@RequiredArgsConstructor
public class ProjectSecurity {

    private final ProjectRepository projectRepository;
    private final MembershipRepository membershipRepository;
    private final TaskRepository taskRepository;
    private final ColumnRepository columnRepository;

    public boolean isMember(Long projectId) {
        User currentUser = SecurityUtils.getCurrentUser();
        System.out.println("[DEBUG isMember] projectId=" + projectId + " currentUserId=" + currentUser.getId()
                + " isAdmin=" + currentUser.isAdmin());
        if (currentUser.isAdmin()) {
            return true;
        }

        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) {
            System.out.println("[DEBUG isMember] project is NULL");
            return false;
        }

        System.out.println(
                "[DEBUG isMember] project.owner=" + (project.getOwner() != null ? project.getOwner().getId() : "null"));
        if (project.getOwner() != null && project.getOwner().getId().equals(currentUser.getId())) {
            System.out.println("[DEBUG isMember] User is OWNER -> true");
            return true;
        }

        boolean hasMembership = membershipRepository.existsByProjectIdAndUserIdAndDeletedAtIsNull(projectId,
                currentUser.getId());
        System.out.println("[DEBUG isMember] hasMembership=" + hasMembership);
        return hasMembership;
    }

    public boolean isManager(Long projectId) {
        User currentUser = SecurityUtils.getCurrentUser();
        if (currentUser.isAdmin()) {
            return true;
        }

        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null)
            return false;

        if (project.getOwner() != null && project.getOwner().getId().equals(currentUser.getId())) {
            return true;
        }

        Optional<Membership> membership = membershipRepository.findByProjectIdAndUserIdAndDeletedAtIsNull(projectId,
                currentUser.getId());
        return membership.map(m -> m.getRoleInProject() == RoleInProject.MANAGER).orElse(false);
    }

    public boolean isManagerForColumn(Long columnId) {
        return columnRepository.findById(columnId)
                .map(col -> isManager(col.getProject().getId()))
                .orElse(false);
    }

    public boolean isMemberForColumn(Long columnId) {
        return columnRepository.findById(columnId)
                .map(col -> isMember(col.getProject().getId()))
                .orElse(false);
    }

    public boolean isManagerForTask(Long taskId) {
        return taskRepository.findById(taskId)
                .map(task -> isManager(task.getColumn().getProject().getId()))
                .orElse(false);
    }

    public boolean isMemberForTask(Long taskId) {
        return taskRepository.findById(taskId)
                .map(task -> isMember(task.getColumn().getProject().getId()))
                .orElse(false);
    }

    public boolean canMoveTask(Long taskId) {
        User currentUser = SecurityUtils.getCurrentUser();
        if (currentUser.isAdmin())
            return true;

        return taskRepository.findById(taskId).map(task -> {
            Long projectId = task.getColumn().getProject().getId();
            if (isManager(projectId))
                return true;

            // Regular member must be an assignee
            return task.getAssignments().stream()
                    .anyMatch(a -> a.getUser().getId().equals(currentUser.getId()));
        }).orElse(false);
    }

    public boolean isManagerForMembership(Long membershipId) {
        return membershipRepository.findById(membershipId)
                .map(m -> isManager(m.getProject().getId()))
                .orElse(false);
    }
}
