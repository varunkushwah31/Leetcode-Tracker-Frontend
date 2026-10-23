package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "PeerStudyPosts")
public class PeerStudyPost {

    @Id
    private String id;

    @Indexed
    private String authorId;
    private String authorName;
    private String authorHandle;
    private String authorAvatarUrl;

    private String problemTitle;
    private String problemSlug;
    private Platform problemPlatform;
    private String problemLink;
    private String topic;
    private String difficulty;

    @Indexed
    private PeerStudyPostType type;

    private String title;
    private String content;
    private String approach;       // e.g. "Two Pointers, Sliding Window"
    private String timeComplexity; // e.g. "O(N)"
    private String spaceComplexity;// e.g. "O(1)"

    @Builder.Default
    private List<PeerStudyReply> replies = new ArrayList<>();

    @Builder.Default
    private Set<String> likes = new HashSet<>();

    @Indexed
    private Instant createdAt;
}
