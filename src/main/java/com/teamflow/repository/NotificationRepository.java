package com.teamflow.repository;

import com.teamflow.entity.Notification;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long userId, Pageable pageable);

    long countByUserIdAndIsReadFalseAndDeletedAtIsNull(Long userId);

    @Query("SELECT n FROM Notification n WHERE n.user.id = :userId AND n.deletedAt IS NULL ORDER BY n.createdAt DESC")
    List<Notification> findRecentByUserId(Long userId, Pageable pageable);
}
