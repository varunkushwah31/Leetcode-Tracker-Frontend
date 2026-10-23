package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeerStudyReply {
    private String id;
    private String authorId;
    private String authorName;
    private String authorHandle;
    private String authorAvatarUrl;
    private String content;
    private Instant createdAt;
}
