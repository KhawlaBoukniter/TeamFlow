package com.teamflow.service;

import com.teamflow.dto.MembershipDTO;
import com.teamflow.entity.Membership;
import com.teamflow.entity.Project;
import com.teamflow.entity.User;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.MembershipRepository;
import com.teamflow.repository.ProjectRepository;
import com.teamflow.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MembershipService {

    private final MembershipRepository membershipRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public MembershipService(MembershipRepository membershipRepository, ProjectRepository projectRepository,
            UserRepository userRepository) {
        this.membershipRepository = membershipRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<MembershipDTO> getMembershipsByProjectId(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        return project.getMemberships().stream()
                .filter(m -> m.getDeletedAt() == null)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public MembershipDTO addMember(Long projectId, MembershipDTO dto) {
        Project project = projectRepository.findById(projectId)
                .filter(p -> p.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        User user = userRepository.findById(dto.getUserId())
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + dto.getUserId()));

        Membership membership = new Membership();
        membership.setProject(project);
        membership.setUser(user);
        membership.setRoleInProject(dto.getRoleInProject());
        membership.setJoinedAt(LocalDateTime.now());

        Membership savedMembership = membershipRepository.save(membership);
        return toDTO(savedMembership);
    }

    @Transactional
    public MembershipDTO updateMemberRole(Long id, MembershipDTO dto) {
        Membership membership = membershipRepository.findById(id)
                .filter(m -> m.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found with id: " + id));

        membership.setRoleInProject(dto.getRoleInProject());

        Membership updatedMembership = membershipRepository.save(membership);
        return toDTO(updatedMembership);
    }

    @Transactional
    public void removeMember(Long id) {
        Membership membership = membershipRepository.findById(id)
                .filter(m -> m.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Membership not found with id: " + id));

        membership.setDeletedAt(LocalDateTime.now());
        membershipRepository.save(membership);
    }

    private MembershipDTO toDTO(Membership membership) {
        MembershipDTO dto = new MembershipDTO();
        dto.setId(membership.getId());
        dto.setRoleInProject(membership.getRoleInProject());
        dto.setUserId(membership.getUser().getId());
        dto.setUserName(membership.getUser().getFullName());
        dto.setUserEmail(membership.getUser().getEmail());
        dto.setProjectId(membership.getProject().getId());
        dto.setJoinedAt(membership.getJoinedAt());
        dto.setCreatedAt(membership.getCreatedAt());
        dto.setUpdatedAt(membership.getUpdatedAt());
        return dto;
    }
}
