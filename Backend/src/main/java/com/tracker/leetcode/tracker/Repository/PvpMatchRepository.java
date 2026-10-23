package com.tracker.leetcode.tracker.Repository;

import com.tracker.leetcode.tracker.Models.PvpMatch;
import com.tracker.leetcode.tracker.Models.PvpMatchStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.time.Instant;
import java.util.List;

public interface PvpMatchRepository extends MongoRepository<PvpMatch, String> {

    @Query("{ $or: [ { 'challengerId': ?0 }, { 'opponentId': ?0 } ] }")
    List<PvpMatch> findByStudentId(String studentId);

    @Query("{ '$and': [ { '$or': [ { 'challengerId': ?0, 'opponentId': ?1 }, { 'challengerId': ?1, 'opponentId': ?0 } ] }, { 'status': 'COMPLETED' } ] }")
    List<PvpMatch> findHeadToHeadCompleted(String studentA, String studentB);

    List<PvpMatch> findByStatusAndExpiresAtBefore(PvpMatchStatus status, Instant now);
}
