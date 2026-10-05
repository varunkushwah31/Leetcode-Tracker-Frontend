package com.tracker.leetcode.tracker.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CuratedProblemDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String title;
    private String titleSlug;
    private String difficulty; // "Easy", "Medium", "Hard"
    private String platform;   // "LEETCODE", "CODEFORCES"
    private String topic;
    private String link;
}
