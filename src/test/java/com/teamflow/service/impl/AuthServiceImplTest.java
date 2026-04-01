package com.teamflow.service.impl;

import com.teamflow.dto.auth.AuthResponse;
import com.teamflow.dto.auth.LoginRequest;
import com.teamflow.dto.auth.RegisterRequest;
import com.teamflow.entity.User;
import com.teamflow.exception.InvalidCredentialsException;
import com.teamflow.repository.UserRepository;
import com.teamflow.security.JwtService;
import com.teamflow.service.interfaces.AuditLogService;
import com.teamflow.service.interfaces.RefreshTokenService;
import com.teamflow.entity.RefreshToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("test@test.com");
        user.setPassword("encodedPassword");
    }

    @Test
    void register_success() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("TEST@test.com ");
        request.setPassword("password");
        request.setFullName("Test User");

        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("refresh-token");
        when(refreshTokenService.createRefreshToken(any())).thenReturn(refreshToken);
        when(jwtService.generateToken(any(), any())).thenReturn("access-token");

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("access-token", response.getToken());
        verify(userRepository).save(any(User.class));
        verify(auditLogService).logAction(eq("REGISTER"), eq("User"), any(), anyString(), any());
    }

    @Test
    void register_duplicateEmail_throwsException() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@test.com");

        when(userRepository.existsByEmailIgnoreCase("test@test.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void login_success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("test@test.com");
        request.setPassword("password");

        when(userRepository.findByEmailIgnoreCase("test@test.com")).thenReturn(Optional.of(user));

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken("refresh-token");
        when(refreshTokenService.createRefreshToken(any())).thenReturn(refreshToken);
        when(jwtService.generateToken(any(), any())).thenReturn("access-token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        verify(authenticationManager).authenticate(any());
        verify(userRepository).save(user);
    }

    @Test
    void login_invalidUser_throwsException() {
        LoginRequest request = new LoginRequest();
        request.setEmail("wrong@test.com");

        when(userRepository.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());

        assertThrows(InvalidCredentialsException.class, () -> authService.login(request));
    }
}
