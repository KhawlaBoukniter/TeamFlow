package com.teamflow.service.interfaces;

import com.teamflow.dto.MessageDTO;
import java.util.List;

public interface MessageService {
    MessageDTO saveMessage(MessageDTO messageDTO);

    List<MessageDTO> getMessagesForRoom(Long roomId);
}
