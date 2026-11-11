package com.cinemaplus.repositories;

import com.cinemaplus.nodes.MovieNode;
import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieNodeRepository extends Neo4jRepository<MovieNode, Long> {

    @Query("MATCH (u:User {id: $userId})-[:WATCHED]->(watched:Movie)-[:HAS_GENRE]->(g:Genre)<-[:HAS_GENRE]-(rec:Movie) " +
           "WHERE NOT (u)-[:WATCHED]->(rec) AND rec.id <> watched.id " +
           "WITH rec, count(DISTINCT g) AS commonGenresScore " +
           "ORDER BY commonGenresScore DESC, rec.id DESC " +
           "RETURN DISTINCT rec " +
           "LIMIT 5")
    List<MovieNode> findRecommendedMoviesByGenre(@Param("userId") Long userId);

    @Query("MATCH (m:Movie) " +
           "OPTIONAL MATCH (u:User)-[:WATCHED]->(m) " +
           "WITH m, count(u) AS viewers " +
           "ORDER BY viewers DESC, m.id DESC " +
           "RETURN m LIMIT 5")
    List<MovieNode> findTopPopularMovies();

    @Query("MATCH (u:User {id: $userId}), (m:Movie {id: $movieId}) " +
           "MERGE (u)-[r:WATCHED]->(m) " +
           "RETURN count(r) > 0")
    Boolean recordWatchedMovie(@Param("userId") Long userId, @Param("movieId") Long movieId);
}

