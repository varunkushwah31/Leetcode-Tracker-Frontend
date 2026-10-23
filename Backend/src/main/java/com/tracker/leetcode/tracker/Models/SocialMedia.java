package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SocialMedia implements Serializable {
    private static final long serialVersionUID = 1L;

    private String github;
    private String linkedin;
    private String twitter;
}
