package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Document(collection = "Classrooms")
public class Classroom {
    @Id
    private String id;

    private String className;

    private String mentorId;

    private List<String> studentIds = new ArrayList<>();

    private List<Assignment> assignments = new ArrayList<>();
}
