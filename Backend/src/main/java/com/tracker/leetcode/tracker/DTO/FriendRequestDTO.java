package com.tracker.leetcode.tracker.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequestDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id; // friendshipId
    private String requesterId;
    private String requesterName;
    private String requesterHandle;
    private String requesterAvatarUrl;

    private String receiverId;
    private String receiverName;
    private String receiverHandle;
    private String receiverAvatarUrl;

    private String status; // PENDING
    private Instant createdAt;
}
