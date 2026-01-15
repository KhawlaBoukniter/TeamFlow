package com.teamflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamflow.dto.validation.Create;
import com.teamflow.dto.validation.Update;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class SubTaskDTO {

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @NotBlank(groups = { Create.class, Update.class })
    private String title;

    private boolean isDone;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long taskId;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime createdAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime updatedAt;
}
