package com.tracker.leetcode.tracker.DTO;

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
public class BulkImportResponseDTO {
    @Builder.Default
    private int totalProcessed = 0;

    @Builder.Default
    private int addedCount = 0;

    @Builder.Default
    private int alreadyEnrolledCount = 0;

    @Builder.Default
    private int failedCount = 0;

    @Builder.Default
    private List<String> addedStudents = new ArrayList<>();

    @Builder.Default
    private List<String> alreadyEnrolledStudents = new ArrayList<>();

    @Builder.Default
    private List<String> failures = new ArrayList<>();

    public List<String> getFailedUsernames() {
        return failures;
    }
}
