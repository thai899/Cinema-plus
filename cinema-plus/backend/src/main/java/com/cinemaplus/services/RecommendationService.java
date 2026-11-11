package com.cinemaplus.services;

import com.cinemaplus.entities.Movie;
import com.cinemaplus.entities.User;
import com.cinemaplus.nodes.MovieNode;
import com.cinemaplus.repositories.MovieNodeRepository;
import com.cinemaplus.repositories.MovieRepository;
import com.cinemaplus.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final MovieNodeRepository movieNodeRepository;
    private final MovieRepository sqlMovieRepository;
    private final UserRepository userRepository;

    /**
     * Lấy danh sách 5 phim gợi ý cho user dựa trên thể loại các phim user đã xem.
     * Nếu chưa có lịch sử, fallback về top phim phổ biến.
     */
    public List<Movie> getRecommendationsForUser(String username) {
        try {
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User không tồn tại: " + username));

            List<MovieNode> recommendedNodes = movieNodeRepository.findRecommendedMoviesByGenre(user.getId());

            if (recommendedNodes == null || recommendedNodes.isEmpty()) {
                log.info("[Recommendation] User {} chưa có lịch sử thể loại, lấy top phim thịnh hành", username);
                recommendedNodes = movieNodeRepository.findTopPopularMovies();
            }

            if (recommendedNodes == null || recommendedNodes.isEmpty()) {
                // Fallback cuối cùng nếu Neo4j chưa có data: lấy 5 phim từ SQL Server
                return sqlMovieRepository.findAll().stream().limit(5).toList();
            }

            List<Long> movieIds = recommendedNodes.stream().map(MovieNode::getId).toList();
            return sqlMovieRepository.findAllById(movieIds);
        } catch (Exception e) {
            log.error("[Recommendation] Lỗi khi truy vấn Neo4j: {}. Fallback sang SQL Server.", e.getMessage());
            return sqlMovieRepository.findAll().stream().limit(5).toList();
        }
    }

    /**
     * Ghi nhận User đã xem một phim vào Graph Neo4j
     */
    public void markMovieAsWatched(Long userId, Long movieId) {
        try {
            movieNodeRepository.recordWatchedMovie(userId, movieId);
            log.info("[Recommendation] Ghi nhận WATCHED: user {} -> movie {}", userId, movieId);
        } catch (Exception ex) {
            log.error("[Recommendation] Lỗi ghi nhận WATCHED vào Neo4j: {}", ex.getMessage());
        }
    }
}

