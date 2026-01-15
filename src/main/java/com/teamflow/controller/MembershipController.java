package com.teamflow.controller;

import com.teamflow.dto.MembershipDTO;
import com.teamflow.dto.validation.Create;
import com.teamflow.dto.validation.Update;
import com.teamflow.service.MembershipService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MembershipController {

    private final MembershipService membershipService;

    public MembershipController(MembershipService membershipService) {
        this.membershipService = membershipService;
    }

    @GetMapping("/projects/{projectId}/members")
    public ResponseEntity<List<MembershipDTO>> getMembershipsByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(membershipService.getMembershipsByProjectId(projectId));
    }

    @PostMapping("/projects/{projectId}/members")
    public ResponseEntity<MembershipDTO> addMember(@PathVariable Long projectId,
            @Validated(Create.class) @RequestBody MembershipDTO dto) {
        return new ResponseEntity<>(membershipService.addMember(projectId, dto), HttpStatus.CREATED);
    }

    @PutMapping("/members/{id}")
    public ResponseEntity<MembershipDTO> updateMemberRole(@PathVariable Long id,
            @Validated(Update.class) @RequestBody MembershipDTO dto) {
        return ResponseEntity.ok(membershipService.updateMemberRole(id, dto));
    }

    @DeleteMapping("/members/{id}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id) {
        membershipService.removeMember(id);
        return ResponseEntity.noContent().build();
    }
}
