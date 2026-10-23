package com.tracker.leetcode.tracker.DTO;

import com.tracker.leetcode.tracker.Models.PeerStudyPostType;
import com.tracker.leetcode.tracker.Models.Platform;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeerStudyPostDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
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

    private PeerStudyPostType type;
    private String title;
    private String content;
    private String approach;
    private String timeComplexity;
    private String spaceComplexity;

    private List<PeerStudyReplyDTO> replies;
    private int likeCount;
    private boolean userLiked;

    private Instant createdAt;
}
