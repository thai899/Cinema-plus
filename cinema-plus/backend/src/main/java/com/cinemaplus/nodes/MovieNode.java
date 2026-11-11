package com.cinemaplus.nodes;

import lombok.*;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Property;
import org.springframework.data.neo4j.core.schema.Relationship;

import java.util.HashSet;
import java.util.Set;

@Node("Movie")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MovieNode {

    @Id
    private Long id; // Map với ID Movie bên SQL Server

    @Property("title")
    private String title;

    @Property("poster_url")
    private String posterUrl;

    @Property("duration")
    private Integer duration;

    @Property("format")
    private String format;

    @Relationship(type = "HAS_GENRE", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private Set<GenreNode> genres = new HashSet<>();

    @Relationship(type = "STARRING", direction = Relationship.Direction.OUTGOING)
    @Builder.Default
    private Set<ActorNode> actors = new HashSet<>();
}

