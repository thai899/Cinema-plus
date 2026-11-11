package com.cinemaplus.documents;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * MongoDB Document — collection "user_activity_logs".
 * TTL Index: tự động xóa sau 90 ngày.
 */
@Document(collection = "user_activity_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserActivityLog {

    @Id
    private String id;

    @Indexed
    @Field("user_id")
    private Long userId;

    @Field("username")
    private String username;

    @Field("action")
    private String action;

    @Field("target_id")
    private String targetId;

    @Field("target_type")
    private String targetType;

    @Field("metadata")
    private Map<String, Object> metadata;

    @Field("ip_address")
    private String ipAddress;

    @Field("user_agent")
    private String userAgent;

    @Indexed(expireAfterSeconds = 7776000)
    @Field("created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
