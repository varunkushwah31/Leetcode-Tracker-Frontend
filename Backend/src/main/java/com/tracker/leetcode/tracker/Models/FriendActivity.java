package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "FriendActivities")
public class FriendActivity {

    @Id
    private String id;

    @Indexed
    private String studentId;
    private String studentName;
    private String studentHandle;
    private String studentAvatarUrl;

    @Indexed
    private String targetStudentId;
    private String targetStudentName;
    private String targetStudentHandle;
    private String targetStudentAvatarUrl;

    @Indexed
    private FriendActivityType type;

    private String title;
    private String description;
    private String link;
    private Platform platform;
    private String difficulty;

    @Builder.Default
    private Set<String> kudosUserIds = new HashSet<>();

    @Builder.Default
    private Map<String, List<String>> reactions = new HashMap<>(); // reaction token -> list of studentIds

    @Indexed
    private Instant createdAt;
}
