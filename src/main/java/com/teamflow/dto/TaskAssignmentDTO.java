package com.teamflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamflow.entity.enums.RoleInTask;
import com.teamflow.dto.validation.Create;
import com.teamflow.dto.validation.Update;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TaskAssignmentDTO {

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @NotNull(groups = { Create.class })
    private Long taskId;

    @NotNull(groups = { Create.class })
    private Long userId;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String userName;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private String userEmail;

    @NotNull(groups = { Create.class, Update.class })
    private RoleInTask roleInTask;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime assignedAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime createdAt;
}
