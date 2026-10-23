package com.tracker.leetcode.tracker.DTO;

import com.tracker.leetcode.tracker.Models.Platform;
import com.tracker.leetcode.tracker.Models.PvpMatchStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PvpMatchDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;

    private String challengerId;
    private String challengerName;
    private String challengerHandle;
    private String challengerAvatarUrl;

    private String opponentId;
    private String opponentName;
    private String opponentHandle;
    private String opponentAvatarUrl;

    private String problemTitle;
    private String problemSlug;
    private Platform problemPlatform;
    private String problemDifficulty;
    private String problemLink;
    private String problemTopic;

    private int durationMinutes;
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

    private String winnerId;
    private String winnerName;

    // Remaining seconds computed for live duel clients
    private Long remainingSeconds;
}
