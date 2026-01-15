package com.teamflow.entity;

import com.teamflow.entity.enums.ProjectStatus;
import com.teamflow.entity.enums.ProjectType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Getter
@Setter
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    private LocalDate startDate;

    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectType type;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private LocalDateTime deletedAt;

    @OneToMany(mappedBy = "project", fetch = FetchType.LAZY)
    private List<ProjectColumn> columns = new ArrayList<>();

    @OneToMany(mappedBy = "project", fetch = FetchType.LAZY)
    private List<Membership> memberships = new ArrayList<>();

    @OneToMany(mappedBy = "project", fetch = FetchType.LAZY)
    private List<ChatRoom> chatRooms = new ArrayList<>();

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
