package com.tracker.leetcode.tracker.Models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "Friendships")
@CompoundIndexes({
        @CompoundIndex(name = "requester_receiver_idx", def = "{'requesterId': 1, 'receiverId': 1}", unique = true)
})
public class Friendship {

    @Id
    private String id;

    @Indexed
    private String requesterId;

    @Indexed
    private String receiverId;

    @Indexed
    private FriendshipStatus status;

    private Instant createdAt;
    private Instant updatedAt;
}
