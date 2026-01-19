package com.teamflow.service.interfaces;

import com.teamflow.dto.auth.AuthResponse;
import com.teamflow.dto.auth.LoginRequest;
import com.teamflow.dto.auth.RegisterRequest;

public interface AuthService {
    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);
}
