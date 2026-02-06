package com.teamflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamflow.entity.enums.ProjectStatus;
import com.teamflow.entity.enums.ProjectType;
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
public class ProjectDTO {

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @NotBlank(groups = { Create.class, Update.class })
    private String name;

    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    @NotNull(groups = { Create.class })
    private ProjectStatus status;

    @NotNull(groups = { Create.class })
    private ProjectType type;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime createdAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime updatedAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private long totalTasks;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private long completedTasks;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private double progress;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private java.util.List<MembershipDTO> team;
}
