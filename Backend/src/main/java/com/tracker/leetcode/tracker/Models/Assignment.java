package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Assignment {
    private String id = UUID.randomUUID().toString();
    private Platform platform = Platform.LEETCODE;
    private String title;
    private String titleSlug; // e.g. "two-sum" or "4A" / "4/A"
    private String questionLink;
    private long startTimestamp;
    private long endTimestamp; // Deadline set by mentor

    public Assignment(String titleSlug, long startTimestamp, long endTimestamp) {
        this.id = UUID.randomUUID().toString();
        this.platform = Platform.LEETCODE;
        this.titleSlug = titleSlug;
        this.startTimestamp = startTimestamp;
        this.endTimestamp = endTimestamp;
        ensureQuestionLink();
    }

    public void setTitleSlug(String titleSlug) {
        this.titleSlug = titleSlug;
        if (this.questionLink == null) {
            ensureQuestionLink();
        }
    }

    public void ensureQuestionLink() {
        if (this.questionLink != null && !this.questionLink.isBlank()) {
            return;
        }

        if (this.titleSlug == null || this.titleSlug.isBlank()) {
            return;
        }

        if (this.platform == Platform.CODEFORCES) {
            // Check if titleSlug is like "4A" or "4/A" or "1234B"
            Pattern cfPattern = Pattern.compile("^(\\d+)[/-]?([A-Za-z0-9]+)$");
            Matcher matcher = cfPattern.matcher(this.titleSlug.trim());
            if (matcher.find()) {
                String contestId = matcher.group(1);
                String index = matcher.group(2).toUpperCase();
                this.questionLink = "https://codeforces.com/problemset/problem/" + contestId + "/" + index;
            } else {
                this.questionLink = "https://codeforces.com/problemset?search=" + this.titleSlug.trim();
            }
        } else {
            this.questionLink = "https://leetcode.com/problems/" + this.titleSlug.trim().toLowerCase() + "/";
        }
    }
}