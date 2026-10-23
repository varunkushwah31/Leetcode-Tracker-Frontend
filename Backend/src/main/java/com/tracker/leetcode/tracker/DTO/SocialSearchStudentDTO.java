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
public class SocialSearchStudentDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String name;
    private String email;
    private String leetcodeUsername;
    private String codeforcesHandle;
    private String avatarUrl;
    private int totalSolved;
    private double currentContestRating;
    private Integer codeforcesRating;
    private int streak;
    private String friendshipStatus; // NONE, PENDING_INCOMING, PENDING_OUTGOING, ACCEPTED
    private String friendshipId;
}
