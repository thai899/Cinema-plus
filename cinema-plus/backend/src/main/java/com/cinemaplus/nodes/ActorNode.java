package com.cinemaplus.nodes;

import lombok.*;
import org.springframework.data.neo4j.core.schema.Id;
import org.springframework.data.neo4j.core.schema.Node;
import org.springframework.data.neo4j.core.schema.Property;

@Node("Actor")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ActorNode {

    @Id
    private Long id;

    @Property("name")
    private String name;

    @Property("avatar")
    private String avatar;
}

