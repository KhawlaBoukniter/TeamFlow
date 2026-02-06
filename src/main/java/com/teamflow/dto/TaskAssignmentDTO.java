package com.teamflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamflow.entity.enums.RoleInTask;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TaskAssignmentDTO {

    private Long id;
    private Long taskId;
    private Long userId;
    private String userName; // Enriched via Mapper
    private String userEmail; // Enriched via Mapper
    private RoleInTask roleInTask;
    private LocalDateTime assignedAt;
}
