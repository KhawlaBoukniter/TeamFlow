package com.teamflow.service.impl;

import com.teamflow.dto.ProjectDTO;
import com.teamflow.entity.Project;
import com.teamflow.entity.User;
import com.teamflow.repository.ProjectRepository;
import com.teamflow.repository.ColumnRepository;
import com.teamflow.repository.MembershipRepository;
import com.teamflow.service.interfaces.AuditLogService;
import com.teamflow.service.interfaces.ChatRoomService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import com.teamflow.security.SecurityUtils;
import com.teamflow.entity.enums.ProjectStatus;
import com.teamflow.entity.enums.ProjectType;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProjectServiceImplTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ColumnRepository columnRepository;
    @Mock
    private MembershipRepository membershipRepository;
    @Mock
    private AuditLogService auditLogService;
    @Mock
    private ChatRoomService chatRoomService;

    @InjectMocks
    private ProjectServiceImpl projectService;

    private User adminUser;
    private User normalUser;

    @BeforeEach
    void setUp() {
        adminUser = new User();
        adminUser.setId(1L);
        adminUser.setEmail("admin@teamflow.com");
        adminUser.setAdmin(true);

        normalUser = new User();
        normalUser.setId(2L);
        normalUser.setEmail("user@teamflow.com");
        normalUser.setAdmin(false);
    }

    @Test
    void getAllProjects_asAdmin_returnsAll() {
        try (MockedStatic<SecurityUtils> mockedSecurity = mockStatic(SecurityUtils.class)) {
            mockedSecurity.when(SecurityUtils::getCurrentUser).thenReturn(adminUser);

            Project p1 = new Project();
            p1.setId(1L);
            p1.setName("Admin Project");
            Project p2 = new Project();
            p2.setId(2L);
            p2.setName("User Project");

            when(projectRepository.findAll()).thenReturn(Arrays.asList(p1, p2));

            List<ProjectDTO> result = projectService.getAllProjects();

            assertNotNull(result);
            assertEquals(2, result.size());
            verify(projectRepository).findAll();
            verify(projectRepository, never()).findProjectsByUserAccess(anyLong());
        }
    }

    @Test
    void getAllProjects_asUser_returnsOnlyOwn() {
        try (MockedStatic<SecurityUtils> mockedSecurity = mockStatic(SecurityUtils.class)) {
            mockedSecurity.when(SecurityUtils::getCurrentUser).thenReturn(normalUser);

            Project p1 = new Project();
            p1.setId(2L);
            p1.setName("User Project");

            when(projectRepository.findProjectsByUserAccess(normalUser.getId()))
                    .thenReturn(Arrays.asList(p1));

            List<ProjectDTO> result = projectService.getAllProjects();

            assertNotNull(result);
            assertEquals(1, result.size());
            assertEquals("User Project", result.get(0).getName());
            verify(projectRepository, never()).findAll();
            verify(projectRepository).findProjectsByUserAccess(normalUser.getId());
        }
    }

    @Test
    void createProject_success() {
        try (MockedStatic<SecurityUtils> mockedSecurity = mockStatic(SecurityUtils.class)) {
            mockedSecurity.when(SecurityUtils::getCurrentUser).thenReturn(normalUser);

            ProjectDTO dto = new ProjectDTO();
            dto.setName("New Project");
            dto.setType(ProjectType.PERSONAL);
            dto.setStatus(ProjectStatus.ACTIVE);

            Project savedProject = new Project();
            savedProject.setId(10L);
            savedProject.setName(dto.getName());
            savedProject.setOwner(normalUser);

            when(projectRepository.save(any(Project.class))).thenReturn(savedProject);

            ProjectDTO result = projectService.createProject(dto);

            assertNotNull(result);
            assertEquals(10L, result.getId());
            verify(projectRepository).save(any(Project.class));
            verify(columnRepository, times(3)).save(any());
            verify(membershipRepository).save(any());
            verify(chatRoomService).createChatRoom(any());
            verify(auditLogService).logAction(eq("CREATE"), eq("Project"), anyLong(), anyLong(), anyString());
        }
    }
}
