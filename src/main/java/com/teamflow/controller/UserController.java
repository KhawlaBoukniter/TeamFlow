package com.teamflow.controller;

import com.teamflow.dto.UserDTO;
import com.teamflow.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserDTO>> searchUsers(@RequestParam(required = false, defaultValue = "") String search) {
        return ResponseEntity.ok(userService.searchUsers(search));
    }
}
