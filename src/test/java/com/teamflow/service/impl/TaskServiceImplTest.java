package com.teamflow.service.impl;

import com.teamflow.dto.TaskDTO;
import com.teamflow.entity.ProjectColumn;
import com.teamflow.entity.Task;
import com.teamflow.repository.ColumnRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.repository.TaskAssignmentRepository;
import com.teamflow.repository.TaskDependencyRepository;
import com.teamflow.service.interfaces.AuditLogService;
import com.teamflow.service.interfaces.NotificationService;
import com.teamflow.repository.AttachmentRepository;
import com.teamflow.repository.UserRepository;
import java.util.Collections;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceImplTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private ColumnRepository columnRepository;
    @Mock
    private TaskAssignmentRepository taskAssignmentRepository;
    @Mock
    private TaskDependencyRepository taskDependencyRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private AttachmentRepository attachmentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private TaskServiceImpl taskService;

    private ProjectColumn column;
    private Task task;

    @BeforeEach
    void setUp() {
        column = new ProjectColumn();
        column.setId(1L);
        column.setName("To Do");

        task = new Task();
        task.setId(10L);
        task.setTitle("Test Task");
        task.setColumn(column);
    }

    @Test
    void createTask_success() {
        TaskDTO dto = new TaskDTO();
        dto.setTitle("New Task");

        when(columnRepository.findById(1L)).thenReturn(Optional.of(column));
        when(taskRepository.save(any(Task.class))).thenAnswer(i -> {
            Task t = i.getArgument(0);
            t.setId(10L);
            return t;
        });
        when(attachmentRepository.findByTaskIdAndDeletedAtIsNull(any())).thenReturn(Collections.emptyList());
        when(taskDependencyRepository.findByDependentId(any())).thenReturn(Collections.emptyList());
        when(taskDependencyRepository.findByPrerequisiteId(any())).thenReturn(Collections.emptyList());

        TaskDTO result = taskService.createTask(1L, dto);

        assertNotNull(result);
        assertEquals("New Task", result.getTitle());
        verify(taskRepository).save(any(Task.class));
        verify(auditLogService).logAction(eq("CREATE"), eq("Task"), any(), anyString());
    }

    @Test
    void moveTask_blockedTask_throwsException() {
        task.setBlocked(true);
        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));

        assertThrows(IllegalStateException.class, () -> taskService.moveTask(10L, 2L));
        verify(taskRepository, never()).save(any());
    }

    @Test
    void moveTask_success() {
        ProjectColumn targetColumn = new ProjectColumn();
        targetColumn.setId(2L);
        targetColumn.setName("In Progress");

        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        when(columnRepository.findById(2L)).thenReturn(Optional.of(targetColumn));
        when(taskRepository.save(any(Task.class))).thenReturn(task);
        when(attachmentRepository.findByTaskIdAndDeletedAtIsNull(any())).thenReturn(Collections.emptyList());
        when(taskDependencyRepository.findByDependentId(any())).thenReturn(Collections.emptyList());
        when(taskDependencyRepository.findByPrerequisiteId(any())).thenReturn(Collections.emptyList());

        TaskDTO result = taskService.moveTask(10L, 2L);

        assertNotNull(result);
        assertEquals(targetColumn.getId(), task.getColumn().getId());
        verify(taskRepository).save(task);
    }
}
