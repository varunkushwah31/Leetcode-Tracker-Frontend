package com.tracker.leetcode.tracker.DTO;

import com.tracker.leetcode.tracker.Models.FriendActivityType;
import com.tracker.leetcode.tracker.Models.Platform;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendActivityDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String studentId;
    private String studentName;
    private String studentHandle;
    private String studentAvatarUrl;

    private FriendActivityType type;
    private String title;
    private String description;
    private String link;
    private Platform platform;
    private String difficulty;

    private int kudosCount;
    private boolean userReacted;
    private Map<String, Integer> reactionCounts; // reaction token -> count
    private List<String> myReactions;

    private Instant createdAt;
}
