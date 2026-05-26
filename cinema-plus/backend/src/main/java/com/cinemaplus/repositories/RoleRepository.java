package com.cinemaplus.repositories;

import com.cinemaplus.entities.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    // Sửa Role.ERole thành String để khớp với trường 'name' trong DB SQL Server
    Optional<Role> findByName(String name);
}