package com.teamflow.repository;

import com.teamflow.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MembershipRepository extends JpaRepository<Membership, Long> {

    List<Membership> findByProjectId(Long projectId);

    Optional<Membership> findByProjectIdAndUserIdAndDeletedAtIsNull(Long projectId, Long userId);

    boolean existsByProjectIdAndUserIdAndDeletedAtIsNull(Long projectId, Long userId);
}
