package com.cinemaplus.nodes;

import lombok.*;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Property;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.util.HashSet;
import java.util.Set;

@Node("User")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserNode {

    @Id
    private Long id; // Map với ID User bên SQL Server

    @Property("username")
    private String username;

    @Relationship(type = "WATCHED", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private Set<MovieNode> watchedMovies = new HashSet<>();
}

