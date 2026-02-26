package com.teamflow.service.impl;

import com.teamflow.dto.UserDTO;
import com.teamflow.entity.User;
import com.teamflow.exception.ResourceNotFoundException;
import com.teamflow.repository.UserRepository;
import com.teamflow.service.interfaces.AuditLogService;
import com.teamflow.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final AuditLogService auditLogService;

    @Override
    @Transactional(readOnly = true)
    public List<UserDTO> searchUsers(String query) {
        return userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query)
                .stream()
                .filter(user -> user.getDeletedAt() == null && user.isActive())
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .filter(user -> user.getDeletedAt() == null)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
        return toDTO(user);
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UserDTO updateUser(Long id, UserDTO dto) {
        User user = userRepository.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        if (dto.getFullName() != null && !dto.getFullName().isBlank()) {
            user.setFullName(dto.getFullName());
        }
        if (dto.getEmail() != null && !dto.getEmail().isBlank()) {
            user.setEmail(dto.getEmail());
        }
        if (dto.isAdmin() != user.isAdmin()) {
            user.setAdmin(dto.isAdmin());
        }

        User savedUser = userRepository.save(user);
        auditLogService.logAction("UPDATE", "User", savedUser.getId(), "Updated user details");
        return toDTO(savedUser);
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setDeletedAt(LocalDateTime.now());
        user.setActive(false);
        userRepository.save(user);
        auditLogService.logAction("DELETE", "User", user.getId(), "Soft deleted user");
    }

    @Override
    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    public UserDTO toggleActive(Long id) {
        User user = userRepository.findById(id)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setActive(!user.isActive());
        User savedUser = userRepository.save(user);
        auditLogService.logAction("TOGGLE_ACTIVE", "User", savedUser.getId(),
                "Toggled user active status to: " + savedUser.isActive());
        return toDTO(savedUser);
    }

    private UserDTO toDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setFullName(user.getFullName());
        dto.setEmail(user.getEmail());
        dto.setActive(user.isActive());
        dto.setAdmin(user.isAdmin());
        dto.setCreatedAt(user.getCreatedAt());
        dto.setUpdatedAt(user.getUpdatedAt());
        dto.setLastLogin(user.getLastLogin());
        return dto;
    }
}
