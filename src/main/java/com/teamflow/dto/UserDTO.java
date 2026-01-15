package com.teamflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.teamflow.dto.validation.Create;
import com.teamflow.dto.validation.Update;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UserDTO {

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Long id;

    @NotBlank(groups = { Create.class, Update.class })
    private String fullName;

    @NotBlank(groups = { Create.class })
    @Email(groups = { Create.class, Update.class })
    private String email;

    @NotBlank(groups = { Create.class })
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private boolean isActive;
    private boolean isAdmin;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime lastLogin;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime createdAt;

    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private LocalDateTime updatedAt;
}
