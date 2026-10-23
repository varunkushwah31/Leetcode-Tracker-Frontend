package com.tracker.leetcode.tracker.DTO;

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
public class PeerStudyReplyDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String authorId;
    private String authorName;
    private String authorHandle;
    private String authorAvatarUrl;
    private String content;
    private Instant createdAt;
}
