package com.cinemaplus.documents;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MongoDB Document — collection "movie_reviews".
 * Key format: lock:showtime:{showtimeId}:seat:{seatId}
 */
@Document(collection = "movie_reviews")
@CompoundIndexes({
    @CompoundIndex(name = "unique_user_movie",
                   def = "{'movie_id': 1, 'user_id': 1}", unique = true),
    @CompoundIndex(name = "movie_created",
                   def = "{'movie_id': 1, 'created_at': -1}")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieReview {

    @Id
    private String id;

    @Indexed
    @Field("movie_id")
    private Long movieId;

    @Indexed
    @Field("user_id")
    private Long userId;

    @Field("username")
    private String username;

    @Field("rating")
    private Integer rating;

    @TextIndexed
    @Field("comment")
    private String comment;

    @Field("images")
    private List<String> images;

    @Field("created_at")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Field("updated_at")
    private LocalDateTime updatedAt;

    @Field("likes_count")
    @Builder.Default
    private Integer likesCount = 0;

    @Field("liked_by")
    private List<Long> likedBy;

    @Field("status")
    @Builder.Default
    private String status = "ACTIVE";
}
