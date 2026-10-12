package com.tracker.leetcode.tracker.Repository;

import com.tracker.leetcode.tracker.Models.Mentor;
import org.springframework.data.mongodb.repository.MongoRepository;


import java.util.Optional;

public interface MentorRepository extends MongoRepository<Mentor,String > {
    Optional<Mentor> findByEmail(String email);
    Optional<Mentor> findByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
}
