package com.cinemaplus.repositories;

import com.cinemaplus.documents.UserActivityLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository cho MongoDB collection "user_activity_logs".
 */
@Repository
public interface UserActivityLogRepository extends MongoRepository<UserActivityLog, String> {

    Page<UserActivityLog> findByUserId(Long userId, Pageable pageable);

    Page<UserActivityLog> findByUserIdAndAction(Long userId, String action, Pageable pageable);

    Page<UserActivityLog> findByTargetIdAndTargetType(String targetId, String targetType, Pageable pageable);

    long countByUserIdAndAction(Long userId, String action);
}

