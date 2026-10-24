package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "PvpMatches")
public class PvpMatch {

    @Id
    private String id;

    @Indexed
    private String challengerId;
    private String challengerName;
    private String challengerHandle;
    private String challengerAvatarUrl;

    @Indexed
    private String opponentId;
    private String opponentName;
    private String opponentHandle;
    private String opponentAvatarUrl;

    private String problemTitle;
    private String problemSlug;
    private Platform problemPlatform;
    private String problemDifficulty; // Easy, Medium, Hard
    private String problemLink;
    private String problemTopic;

    private int durationMinutes; // e.g. 15, 30, 45, 60

    @Indexed
    private PvpMatchStatus status;

    private Instant createdAt;
    private Instant startedAt;
    private Instant expiresAt;
    private Instant completedAt;

    private boolean challengerSolved;
    private Instant challengerSolvedAt;
    private String challengerSubmissionUrl;

    private boolean opponentSolved;
    private Instant opponentSolvedAt;
    private String opponentSubmissionUrl;

    private String winnerId; // null if draw or in progress
    private String winnerName;

    private Integer challengerRating;
    private Integer opponentRating;
    private Integer challengerRatingDelta;
    private Integer opponentRatingDelta;
}
