package com.cinemaplus.repositories;

import com.cinemaplus.documents.MovieReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository cho MongoDB collection "movie_reviews".
 *
 * <p>Hỗ trợ:
 * <ul>
 *   <li>Phân trang ({@link Page}) cho tất cả query danh sách</li>
 *   <li>Lọc theo rating (1–5 sao)</li>
 *   <li>Tìm kiếm từ khóa trong comment (regex, case-insensitive)</li>
 * </ul>
 */
@Repository
public interface MovieReviewRepository extends MongoRepository<MovieReview, String> {

    // ── Lấy danh sách theo movieId (phân trang, sắp xếp từ ngoài) ────────────
    Page<MovieReview> findByMovieIdAndStatus(Long movieId, String status, Pageable pageable);

    // ── Lọc theo movieId + rating cụ thể ─────────────────────────────────────
    Page<MovieReview> findByMovieIdAndRatingAndStatus(Long movieId, Integer rating, String status, Pageable pageable);

    // ── Tìm kiếm từ khóa trong comment (case-insensitive regex) ──────────────
    @Query("{ 'movie_id': ?0, 'status': ?2, 'comment': { $regex: ?1, $options: 'i' } }")
    Page<MovieReview> searchByKeywordInComment(Long movieId, String keyword, String status, Pageable pageable);

    // ── Lọc rating + tìm kiếm từ khóa cùng lúc ───────────────────────────────
    @Query("{ 'movie_id': ?0, 'rating': ?1, 'status': ?3, 'comment': { $regex: ?2, $options: 'i' } }")
    Page<MovieReview> searchByRatingAndKeyword(Long movieId, Integer rating, String keyword, String status, Pageable pageable);

    // ── Kiểm tra user đã review phim này chưa ────────────────────────────────
    boolean existsByMovieIdAndUserId(Long movieId, Long userId);

    // ── Lấy review của 1 user cho 1 phim cụ thể ──────────────────────────────
    Optional<MovieReview> findByMovieIdAndUserId(Long movieId, Long userId);

    // ── Thống kê số review theo movieId ──────────────────────────────────────
    long countByMovieIdAndStatus(Long movieId, String status);

    // ── Lấy tất cả review của 1 user (trang cá nhân) ─────────────────────────
    Page<MovieReview> findByUserIdAndStatus(Long userId, String status, Pageable pageable);

    // ── Tính điểm trung bình theo movieId (dùng aggregation pipeline) ─────────
    @Query(value = "{ 'movie_id': ?0, 'status': 'ACTIVE' }", fields = "{ 'rating': 1 }")
    java.util.List<MovieReview> findRatingsByMovieId(Long movieId);
}
