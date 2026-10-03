package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RecentSubmission {
    private String title;
    private String titleSlug;
    private long timestamp;
    private String questionLink;
    private Platform platform = Platform.LEETCODE;

    // Backward-compatible constructor for LeetCode
    public RecentSubmission(String title, String titleSlug, long timestamp) {
        this.title = title;
        this.titleSlug = titleSlug;
        this.timestamp = timestamp;
        this.platform = Platform.LEETCODE;
        this.questionLink = "https://leetcode.com/problems/" + titleSlug + "/";
    }

    public RecentSubmission(String title, String titleSlug, long timestamp, Platform platform, String questionLink) {
        this.title = title;
        this.titleSlug = titleSlug;
        this.timestamp = timestamp;
        this.platform = platform != null ? platform : Platform.LEETCODE;
        this.questionLink = questionLink;
    }

    public void setTitleSlug(String titleSlug) {
        this.titleSlug = titleSlug;
        if (this.questionLink == null && this.platform == Platform.LEETCODE) {
            this.questionLink = "https://leetcode.com/problems/" + titleSlug + "/";
        }
    }
}