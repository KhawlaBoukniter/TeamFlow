package com.teamflow.service.impl;

import com.teamflow.dto.DashboardDTO;
import com.teamflow.entity.Project;
import com.teamflow.entity.Task;
import com.teamflow.entity.enums.ProjectStatus;
import com.teamflow.repository.ProjectRepository;
import com.teamflow.security.SecurityUtils;
import com.teamflow.service.interfaces.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final ProjectRepository projectRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardDTO getStats() {
        Long userId = SecurityUtils.getCurrentUserId();
        List<Project> projects = projectRepository.findProjectsByUserAccess(userId);

        long totalProjects = projects.size();
        long activeProjects = projects.stream()
                .filter(p -> p.getStatus() == ProjectStatus.ACTIVE)
                .count();

        // Collect all tasks from user's projects
        List<Task> allTasks = projects.stream()
                .flatMap(p -> p.getColumns().stream())
                .filter(c -> c.getDeletedAt() == null)
                .flatMap(c -> c.getTasks().stream())
                .filter(t -> t.getDeletedAt() == null)
                .collect(Collectors.toList());

        long totalTasks = allTasks.size();

        long completedTasks = allTasks.stream()
                .filter(t -> t.getColumn() != null && t.getColumn().isFinal())
                .count();

        long overdueTasks = allTasks.stream()
                .filter(t -> t.getDueDate() != null
                        && t.getDueDate().isBefore(LocalDate.now())
                        && (t.getColumn() == null || !t.getColumn().isFinal()))
                .count();

        long blockedTasks = allTasks.stream()
                .filter(Task::isBlocked)
                .count();

        Map<String, Long> tasksByPriority = new HashMap<>();
        tasksByPriority.put("HIGH", allTasks.stream()
                .filter(t -> t.getPriority() != null && t.getPriority().name().equals("HIGH")).count());
        tasksByPriority.put("MEDIUM", allTasks.stream()
                .filter(t -> t.getPriority() != null && t.getPriority().name().equals("MEDIUM")).count());
        tasksByPriority.put("LOW",
                allTasks.stream().filter(t -> t.getPriority() != null && t.getPriority().name().equals("LOW")).count());

        return DashboardDTO.builder()
                .totalProjects(totalProjects)
                .activeProjects(activeProjects)
                .totalTasks(totalTasks)
                .completedTasks(completedTasks)
                .overdueTasks(overdueTasks)
                .blockedTasks(blockedTasks)
                .tasksByPriority(tasksByPriority)
                .build();
    }
}
