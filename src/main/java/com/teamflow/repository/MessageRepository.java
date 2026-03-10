package com.teamflow.repository;

import com.teamflow.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    Long countByChatRoomIdAndCreatedAtAfterAndDeletedAtIsNull(Long chatRoomId, LocalDateTime after);

    Long countByChatRoomIdAndSenderIdNotAndCreatedAtAfterAndDeletedAtIsNull(Long chatRoomId, Long senderId,
            LocalDateTime after);

    java.util.List<Message> findByChatRoomIdAndDeletedAtIsNull(Long chatRoomId);
}
