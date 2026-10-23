package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Badge implements Serializable {
    private static final long serialVersionUID = 1L;

    private String title;
    private String icon;
    private String timestamp; // LeetCode returns this as a string formatted date
}
