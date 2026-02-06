package com.teamflow.repository;

import com.teamflow.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, Long> {
    java.util.List<Membership> findByProjectId(Long projectId);
}
