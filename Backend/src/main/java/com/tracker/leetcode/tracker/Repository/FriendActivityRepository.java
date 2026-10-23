package com.tracker.leetcode.tracker.Repository;

import com.tracker.leetcode.tracker.Models.FriendActivity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;

public interface FriendActivityRepository extends MongoRepository<FriendActivity, String> {

    List<FriendActivity> findByStudentIdInOrderByCreatedAtDesc(Collection<String> studentIds, Pageable pageable);

    List<FriendActivity> findTop50ByOrderByCreatedAtDesc();
}
