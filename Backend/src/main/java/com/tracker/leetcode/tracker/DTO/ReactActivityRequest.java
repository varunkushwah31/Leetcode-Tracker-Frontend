package com.tracker.leetcode.tracker.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactActivityRequest {
    private String reaction; // e.g. "fire", "rocket", "insight", "clap", "heart", "kudos"
}
