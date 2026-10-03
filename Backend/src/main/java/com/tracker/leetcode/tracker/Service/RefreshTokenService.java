package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Exception.RefreshTokenException;
import com.tracker.leetcode.tracker.Models.RefreshToken;
import com.tracker.leetcode.tracker.Repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${application.security.jwt.refresh-token.expiration}")
    private long refreshTokenDurationMs;

    public RefreshToken createRefreshToken(String mentorId){
        RefreshToken refreshToken = RefreshToken.builder()
                .mentorId(mentorId)
                .token(UUID.randomUUID().toString())
                .expiryDate(Instant.now().plusMillis(refreshTokenDurationMs))
                .build();
        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyExpiration(RefreshToken token){
        if (token.getExpiryDate().compareTo(Instant.now()) < 0){
            refreshTokenRepository.delete(token);
            throw new RefreshTokenException("Refresh token was expired. Please make new sign in request");
        }
        if (token.isRevoked()){
            throw new RefreshTokenException("Refresh token has been revoked.");
        }
        return token;
    }

    // 3. Find token in DB
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    // 4. Burn a token (used for Rotation and Logout)
    public void deleteByMentorId(String mentorId) {
        refreshTokenRepository.deleteByMentorId(mentorId);
    }

    public void deleteByToken(String token) {
        refreshTokenRepository.findByToken(token).ifPresent(refreshTokenRepository::delete);
    }
}
