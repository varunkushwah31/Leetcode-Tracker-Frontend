package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ContestHistory implements Serializable {
    private static final long serialVersionUID = 1L;

    private String title;
    private long timestamp;
    private double rating;
    private int ranking;
    private int problemsSolved;
    private int totalProblems;
}
