package com.tracker.leetcode.tracker.DTO;

import com.tracker.leetcode.tracker.Models.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MentorDTO {
    private String id;
    private String name;
    private String email;
    private Role role;
    private List<String> classroomIds;
}
