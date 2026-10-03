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
    private String problemNumber; // e.g. "1" for LeetCode #1, or "4A" for Codeforces 4A
    private String title;
    private String titleSlug; // e.g. "two-sum" or "4A"
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
        ensureQuestionLink();
    }

    public void ensureQuestionLink() {
        String input = (this.questionLink != null && !this.questionLink.isBlank()) 
                ? this.questionLink.trim() 
                : (this.titleSlug != null ? this.titleSlug.trim() : "");

        if (input.isBlank()) {
            return;
        }

        // 1. Check if input is a Codeforces URL
        Pattern cfUrlPattern = Pattern.compile("(?i)codeforces\\.com/(?:problemset/problem|contest|gym)/(\\d+)/(?:problem/)?([A-Za-z0-9]+)");
        Matcher cfUrlMatcher = cfUrlPattern.matcher(input);
        if (cfUrlMatcher.find()) {
            this.platform = Platform.CODEFORCES;
            String contestId = cfUrlMatcher.group(1);
            String index = cfUrlMatcher.group(2).toUpperCase();
            this.titleSlug = contestId + index;
            this.problemNumber = contestId + index;
            this.questionLink = "https://codeforces.com/problemset/problem/" + contestId + "/" + index;
            return;
        }

        // 2. Check if input is a LeetCode URL
        Pattern lcUrlPattern = Pattern.compile("(?i)leetcode\\.(?:com|cn)/problems/([a-zA-Z0-9_-]+)");
        Matcher lcUrlMatcher = lcUrlPattern.matcher(input);
        if (lcUrlMatcher.find()) {
            this.platform = Platform.LEETCODE;
            String slug = lcUrlMatcher.group(1).toLowerCase();
            this.titleSlug = slug;
            this.questionLink = "https://leetcode.com/problems/" + slug + "/";
            return;
        }

        // 3. Fallback when input is an identifier/slug (not a full URL)
        if (this.platform == Platform.CODEFORCES) {
            Pattern cfPattern = Pattern.compile("^(\\d+)[/-]?([A-Za-z0-9]+)$");
            Matcher matcher = cfPattern.matcher(input);
            if (matcher.find()) {
                String contestId = matcher.group(1);
                String index = matcher.group(2).toUpperCase();
                this.titleSlug = contestId + index;
                this.problemNumber = contestId + index;
                this.questionLink = "https://codeforces.com/problemset/problem/" + contestId + "/" + index;
            } else if (this.questionLink == null || this.questionLink.isBlank()) {
                this.questionLink = "https://codeforces.com/problemset?search=" + input;
            }
        } else {
            String cleanSlug = input.replaceAll("^https?://[^/]+/problems/", "").replaceAll("/.*$", "").toLowerCase();
            this.titleSlug = cleanSlug;
            this.questionLink = "https://leetcode.com/problems/" + cleanSlug + "/";
        }
    }
}