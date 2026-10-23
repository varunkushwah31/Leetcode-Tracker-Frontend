package com.tracker.leetcode.tracker.Repository;

import com.tracker.leetcode.tracker.Models.Friendship;
import com.tracker.leetcode.tracker.Models.FriendshipStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends MongoRepository<Friendship, String> {

    Optional<Friendship> findByRequesterIdAndReceiverId(String requesterId, String receiverId);

    @Query("{ $or: [ { 'requesterId': ?0, 'receiverId': ?1 }, { 'requesterId': ?1, 'receiverId': ?0 } ] }")
    Optional<Friendship> findBetween(String studentA, String studentB);

    List<Friendship> findByReceiverIdAndStatus(String receiverId, FriendshipStatus status);

    List<Friendship> findByRequesterIdAndStatus(String requesterId, FriendshipStatus status);

    @Query("{ $and: [ { $or: [ { 'requesterId': ?0 }, { 'receiverId': ?0 } ] }, { 'status': ?1 } ] }")
    List<Friendship> findAllByStudentIdAndStatus(String studentId, FriendshipStatus status);

    @Query("{ $or: [ { 'requesterId': ?0 }, { 'receiverId': ?0 } ] }")
    List<Friendship> findAllByStudentId(String studentId);
}
