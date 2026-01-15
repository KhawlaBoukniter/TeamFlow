package com.teamflow.entity;

import com.teamflow.entity.enums.DependencyType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "task_dependencies", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "prerequisite_id", "dependent_id" })
})
@Getter
@Setter
public class TaskDependency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DependencyType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prerequisite_id", nullable = false)
    private Task prerequisite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dependent_id", nullable = false)
    private Task dependent;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
