package com.tracker.leetcode.tracker.DTO;

import com.tracker.leetcode.tracker.Models.PeerStudyPostType;
import com.tracker.leetcode.tracker.Models.Platform;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePeerStudyPostRequest {
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
}
