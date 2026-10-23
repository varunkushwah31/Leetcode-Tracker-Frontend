package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class ProblemStats implements Serializable {
    private static final long serialVersionUID = 1L;

    private String difficulty;
    private int count;
    private double beatsPercentage;
}
