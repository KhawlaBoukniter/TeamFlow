package com.teamflow.service.impl;

import com.teamflow.dto.NotificationDTO;
import com.teamflow.entity.Notification;
import com.teamflow.entity.User;
import com.teamflow.entity.enums.NotificationType;
import com.teamflow.repository.NotificationRepository;
import com.teamflow.repository.UserRepository;
import com.teamflow.service.interfaces.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public void createNotification(Long userId, String message, NotificationType type, String entityType,
            Long entityId, Long projectId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);
        notification.setType(type);
        notification.setEntityType(entityType);
        notification.setEntityId(entityId);
        notification.setProjectId(projectId);
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());

        Notification saved = notificationRepository.save(notification);

        messagingTemplate.convertAndSend("/topic/notifications/" + userId, toDTO(saved));
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationDTO> getRecentNotifications(Long userId, int limit) {
        return notificationRepository.findRecentByUserId(userId, PageRequest.of(0, limit))
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalseAndDeletedAtIsNull(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findRecentByUserId(userId, PageRequest.of(0, 100))
                .stream()
                .filter(n -> !n.isRead())
                .collect(Collectors.toList());

        LocalDateTime now = LocalDateTime.now();
        unread.forEach(n -> {
            n.setRead(true);
            n.setReadAt(now);
        });
        notificationRepository.saveAll(unread);
    }

    private NotificationDTO toDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .type(notification.getType())
                .message(notification.getMessage())
                .isRead(notification.isRead())
                .readAt(notification.getReadAt())
                .entityType(notification.getEntityType())
                .entityId(notification.getEntityId())
                .projectId(notification.getProjectId())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
