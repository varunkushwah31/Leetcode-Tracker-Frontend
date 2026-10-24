package com.tracker.leetcode.tracker.Security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Slf4j
@Service
@SuppressWarnings("java:S2143") // JJWT library requires java.util.Date; conversion at boundaries is unnecessary overhead
public class JwtService {

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    @Value("${application.security.jwt.expiration}")
    private long jwtExpiration;

    // 1. Generate Token WITHOUT extra claims
    public String generateToken(UserDetails userDetails) {
        // Pass an empty, mutable map to the main method
        return generateToken(new HashMap<>(), userDetails);
    }

    // 2. Generate Token WITH extra claims
    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {

        // We create a new HashMap here to ensure it is mutable.
        // If someone passed Map.of() into extraClaims, putIfAbsent would crash!
        Map<String, Object> claims = new HashMap<>(extraClaims);

        // Inject roles ONLY if they haven't already been provided
        claims.putIfAbsent("roles", userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .toList());

        return Jwts.builder()
                .claims(claims) // Modern syntax
                .subject(userDetails.getUsername()) // Modern syntax
                .issuedAt(Date.from(Instant.now())) // Modern syntax
                .expiration(Date.from(Instant.now().plusMillis(jwtExpiration))) // Modern syntax
                .signWith(getSignInKey()) // Automatically uses the best algorithm
                .compact();
    }
    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }


    public String extractUsername(String token){
        return extractClaim(token, Claims::getSubject);
    }

    @SuppressWarnings("unchecked")
    public java.util.List<String> extractRoles(String token) {
        return extractClaim(token, claims -> (java.util.List<String>) claims.get("roles"));
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        if (claims == null || claims.isEmpty()) {
            return null;
        }
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith((SecretKey) getSignInKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException e) {
            log.warn("JWT Token is expired: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.warn("JWT Token is unsupported: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.warn("Invalid JWT Token: {}", e.getMessage());
        } catch (SignatureException e) {
            log.warn("Invalid JWT signature: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.warn("JWT claims string is empty: {}", e.getMessage());
        }
        return io.jsonwebtoken.Jwts.claims().build();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);
            return (username != null && username.equals(userDetails.getUsername())) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isTokenExpired(String token) {
        Date expiration = extractExpiration(token);
        return expiration != null && expiration.before(new Date());
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public Date extractIssuedAt(String token) {
        return extractClaim(token, Claims::getIssuedAt);
    }
}
