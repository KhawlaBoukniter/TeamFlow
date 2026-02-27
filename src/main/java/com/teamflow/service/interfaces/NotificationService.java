package com.teamflow.service.interfaces;

import com.teamflow.dto.NotificationDTO;
import com.teamflow.entity.enums.NotificationType;
import java.util.List;

public interface NotificationService {

    void createNotification(Long userId, String message, NotificationType type, String entityType, Long entityId);

    List<NotificationDTO> getRecentNotifications(Long userId, int limit);

    long countUnread(Long userId);

    void markAsRead(Long notificationId);

    void markAllAsRead(Long userId);
}
