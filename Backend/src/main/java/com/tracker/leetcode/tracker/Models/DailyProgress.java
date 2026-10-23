package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DailyProgress implements Serializable {
    private static final long serialVersionUID = 1L;

    private LocalDate date;
    private int questionSolved;
}
