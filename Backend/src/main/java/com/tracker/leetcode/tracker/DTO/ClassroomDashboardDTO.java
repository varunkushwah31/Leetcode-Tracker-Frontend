package com.tracker.leetcode.tracker.DTO;

import com.tracker.leetcode.tracker.Models.Assignment;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomDashboardDTO {
    private String classroomId;
    private String className;
    private String mentorName;

    // Notice we reuse our existing StudentSummaryDTO here!
    @Builder.Default
    private List<StudentSummaryDTO> enrolledStudents = new ArrayList<>();

    @Builder.Default
    private List<Assignment> assignments = new ArrayList<>();
}