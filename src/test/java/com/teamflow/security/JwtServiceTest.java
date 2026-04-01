package com.teamflow.security;

import com.teamflow.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private User user;
    private CustomUserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey",
                "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970");
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3600000L);

        user = new User();
        user.setId(1L);
        user.setEmail("test@test.com");
        user.setAdmin(true);

        userDetails = new CustomUserDetails(user);
    }

    @Test
    void generateAndValidateToken() {
        Map<String, Object> extraClaims = new HashMap<>();
        extraClaims.put("userId", 1L);
        extraClaims.put("isAdmin", true);

        String token = jwtService.generateToken(extraClaims, userDetails);
        assertNotNull(token);

        String username = jwtService.extractUsername(token);
        assertEquals(user.getEmail(), username);

        Long userId = jwtService.extractClaim(token, claims -> claims.get("userId", Long.class));
        assertEquals(1L, userId);

        assertTrue(jwtService.isTokenValid(token, userDetails));
    }
}
