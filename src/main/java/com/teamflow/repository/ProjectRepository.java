package com.teamflow.repository;

import com.teamflow.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {

    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN p.memberships m " +
            "WHERE p.deletedAt IS NULL AND " +
            "(p.owner.id = :userId OR (m.user.id = :userId AND m.deletedAt IS NULL))")
    List<Project> findProjectsByUserAccess(@Param("userId") Long userId);

    @Query("SELECT p FROM Project p JOIN p.chatRooms cr WHERE cr.id = :chatRoomId")
    Optional<Project> findByChatRoomId(@Param("chatRoomId") Long chatRoomId);
}
