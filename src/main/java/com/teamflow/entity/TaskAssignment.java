package com.teamflow.entity;

import com.teamflow.entity.enums.RoleInTask;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.teamflow.entity.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_assignments", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "task_id", "user_id" })
})
@Getter
@Setter
public class TaskAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleInTask roleInTask;

    @Column(nullable = false)
    private LocalDateTime assignedAt;

    @Column(nullable = false)
    private boolean isActive = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.assignedAt == null) {
            this.assignedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
