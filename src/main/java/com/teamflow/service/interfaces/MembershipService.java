package com.teamflow.service.interfaces;

import com.teamflow.dto.MembershipDTO;
import java.util.List;

public interface MembershipService {
    List<MembershipDTO> getMembershipsByProjectId(Long projectId);

    MembershipDTO addMember(Long projectId, MembershipDTO dto);

    MembershipDTO updateMemberRole(Long id, MembershipDTO dto);

    void removeMember(Long id);
}
