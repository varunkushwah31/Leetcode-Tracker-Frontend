package com.tracker.leetcode.tracker.Repository;

import com.tracker.leetcode.tracker.Models.Student;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface StudentRepository extends MongoRepository<Student, String> {
    Optional<Student> findByLeetcodeUsername(String leetcodeUsername);
    Optional<Student> findByCodeforcesHandle(String codeforcesHandle);
    Optional<Student> findByEmail(String email);
    boolean existsByLeetcodeUsername(String leetcodeUsername);
    boolean existsByCodeforcesHandle(String codeforcesHandle);
}
