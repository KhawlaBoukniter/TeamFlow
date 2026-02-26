package com.teamflow.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@Builder
public class DashboardDTO {
    private long totalProjects;
    private long activeProjects;
    private long totalTasks;
    private long completedTasks;
    private long overdueTasks;
    private long blockedTasks;
    private Map<String, Long> tasksByPriority;
}
