package com.cinemaplus.nodes;

import lombok.*;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Property;

@Node("Genre")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GenreNode {

    @Id
    private Long id; // Map với ID Genre bên SQL Server

    @Property("name")
    private String name;
}

