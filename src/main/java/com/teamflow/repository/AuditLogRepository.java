package com.teamflow.repository;

import com.teamflow.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findByEntityAndEntityIdOrderByCreatedAtDesc(String entity, Long entityId, Pageable pageable);

    Page<AuditLog> findByProjectIdOrderByCreatedAtDesc(Long projectId, Pageable pageable);

    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
