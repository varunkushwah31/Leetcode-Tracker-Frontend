package com.tracker.leetcode.tracker.Repository;

import com.tracker.leetcode.tracker.Models.PeerStudyPost;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;

public interface PeerStudyPostRepository extends MongoRepository<PeerStudyPost, String> {

    List<PeerStudyPost> findByTopicIgnoreCaseOrderByCreatedAtDesc(String topic, Pageable pageable);

    List<PeerStudyPost> findByAuthorIdInOrderByCreatedAtDesc(Collection<String> authorIds, Pageable pageable);

    List<PeerStudyPost> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
