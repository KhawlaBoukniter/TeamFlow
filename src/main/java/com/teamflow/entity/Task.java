package com.teamflow.entity;

import com.teamflow.entity.enums.Priority;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tasks")
@Getter
@Setter
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    private LocalDate dueDate;

    @Column(nullable = false)
    private boolean isBlocked = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", nullable = false)
    private ProjectColumn column;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "task", fetch = FetchType.LAZY)
    private List<SubTask> subTasks = new ArrayList<>();

    @OneToMany(mappedBy = "task", fetch = FetchType.LAZY)
    private List<Comment> comments = new ArrayList<>();

    @OneToMany(mappedBy = "task", fetch = FetchType.LAZY)
    private List<Attachment> attachments = new ArrayList<>();

    @OneToMany(mappedBy = "task", fetch = FetchType.LAZY)
    private List<TaskAssignment> assignments = new ArrayList<>();

    @OneToMany(mappedBy = "dependent", fetch = FetchType.LAZY)
    private List<TaskDependency> dependenciesAsDependent = new ArrayList<>();

    @OneToMany(mappedBy = "prerequisite", fetch = FetchType.LAZY)
    private List<TaskDependency> dependenciesAsPrerequisite = new ArrayList<>();

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
