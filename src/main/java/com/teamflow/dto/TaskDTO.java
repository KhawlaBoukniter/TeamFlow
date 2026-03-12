package com.teamflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamflow.entity.enums.Priority;
import com.teamflow.dto.validation.Create;
import com.teamflow.dto.validation.Update;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
public class TaskDTO {

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @NotBlank(groups = { Create.class, Update.class })
    private String title;

    private String description;

    @NotNull(groups = { Create.class, Update.class })
    private Priority priority;

    private LocalDate dueDate;

    private boolean isBlocked;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long columnId;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String columnName;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String projectName;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long projectId;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime createdAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime updatedAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private java.util.List<TaskAssignmentDTO> assignments;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private java.util.List<TaskSummaryDTO> blockingTasks;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private java.util.List<TaskSummaryDTO> blockedTasks;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private java.util.List<AttachmentDTO> attachments;
}
