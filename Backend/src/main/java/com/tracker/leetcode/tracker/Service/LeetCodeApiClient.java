package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Exception.LeetCodeApiException;
import com.tracker.leetcode.tracker.Models.*;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component // Tells Spring to manage this class as a reusable tool
public class LeetCodeApiClient {

    private final String LEETCODE_API_URL = "https://leetcode.com/graphql";
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpHeaders headers;
    private final RedisTemplate<String, Object> redisTemplate;

    public LeetCodeApiClient(RedisTemplate<String, Object> redisTemplate) {
        this(redisTemplate, new RestTemplate());
    }

    @org.springframework.beans.factory.annotation.Autowired
    public LeetCodeApiClient(RedisTemplate<String, Object> redisTemplate, RestTemplate restTemplate) {
        this.redisTemplate = redisTemplate;
        this.restTemplate = restTemplate;
        headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set(HttpHeaders.USER_AGENT, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
        headers.set(HttpHeaders.REFERER, "https://leetcode.com");
    }


    private JsonNode executeGraphQLQuery(String query, String username) {
        try {
            HttpEntity<String> request = new HttpEntity<>(query, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(LEETCODE_API_URL, request, String.class);

            if (response.getBody() == null) {
                throw new LeetCodeApiException("Empty response from LeetCode API for user: " + username);
            }

            return objectMapper.readTree(response.getBody());
        } catch (LeetCodeApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Network or JSON parsing error for user {}: {}", username, e.getMessage());
            throw new LeetCodeApiException("Failed to communicate with LeetCode servers for user: " + username);
        }
    }

    /**
     * Save data to Redis cache for fallback use when circuit breaker opens
     * TTL: 7 days to preserve stale data
     */
    private void cacheDataForFallback(String key, Object data) {
        try {
            redisTemplate.opsForValue().set(key, data, 7, TimeUnit.DAYS);
            log.debug("Data cached in Redis for fallback: {}", key);
        } catch (Exception e) {
            log.warn("Failed to cache data for fallback: {}", e.getMessage());
        }
    }

    /**
     * Retrieve fallback data from Redis cache
     * Used when circuit breaker is OPEN to serve stale data
     */
    private <T> T getFallbackDataFromCache(String key, Class<T> type) {
        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                log.info("Using fallback data from Redis cache: {}", key);
                return (T) cached;
            }
        } catch (Exception e) {
            log.warn("Failed to retrieve fallback data from cache: {}", e.getMessage());
        }
        return null;
    }

    // 1. Fetch Calendar Heatmap Data
    @CircuitBreaker(name = "leetcodeApi", fallbackMethod = "fetchCalendarDataFallback")
    @Retry(name = "leetcodeApi")
    @RateLimiter(name = "leetcodeApi")
    public List<DailyProgress> fetchCalendarData(String username) {
        String query = """
                {"query":"query userProfileCalendar($username: String!) { matchedUser(username: $username) { userCalendar { submissionCalendar } } }","variables":{"username":"%s"}}
                """.formatted(username);

        JsonNode root = executeGraphQLQuery(query, username);
        JsonNode matchedUser = root.path("data").path("matchedUser");
        if (matchedUser.isMissingNode() || matchedUser.isNull()) {
            throw new LeetCodeApiException("LeetCode user not found: " + username);
        }

        JsonNode calendarNode = matchedUser.path("userCalendar").path("submissionCalendar");

        if (calendarNode.isMissingNode() || calendarNode.isNull() || calendarNode.asString("").isBlank()) {
            log.info("LeetCode returned no calendar data for user: {}", username);
            return new ArrayList<>();
        }

        try {
            String calendarStr = calendarNode.asString();
            if (calendarStr == null || calendarStr.isBlank() || "{}".equals(calendarStr.trim())) {
                return new ArrayList<>();
            }
            Map<String, Integer> submissionMap = objectMapper.readValue(calendarStr, new TypeReference<>() {});
            List<DailyProgress> progressList = new ArrayList<>();

            for (Map.Entry<String, Integer> entry : submissionMap.entrySet()) {
                LocalDate date = Instant.ofEpochSecond(Long.parseLong(entry.getKey())).atZone(ZoneId.systemDefault()).toLocalDate();
                progressList.add(new DailyProgress(date, entry.getValue()));
            }

            // Cache for fallback
            cacheDataForFallback("leetcode:calendar:" + username, progressList);
            return progressList;
        } catch (Exception e) {
            log.error("Failed to map Calendar data for {}: {}", username, e.getMessage());
            return new ArrayList<>();
        }
    }

    /**
     * Fallback method when circuit is OPEN - serves stale data from Redis
     */
    public List<DailyProgress> fetchCalendarDataFallback(String username, Exception ex) {
        log.warn("Circuit breaker OPEN for calendar data of {}. Serving stale data from cache. Error: {}",
                username, ex.getMessage());
        List<DailyProgress> cached = getFallbackDataFromCache("leetcode:calendar:" + username, List.class);
        if (cached != null) {
            return cached;
        }
        throw new LeetCodeApiException("LeetCode API is temporarily unavailable and no cached data exists for user: " + username);
    }

    // 2. Fetch Problem Stats Data
    @CircuitBreaker(name = "leetcodeApi", fallbackMethod = "fetchProblemStatsFallback")
    @Retry(name = "leetcodeApi")
    @RateLimiter(name = "leetcodeApi")
    public List<ProblemStats> fetchProblemStats(String username) {
        String query = """
                {"query":"query userProblemsSolved($username: String!) { allQuestionsCount { difficulty count } matchedUser(username: $username) { problemsSolvedBeatsStats { difficulty percentage } submitStatsGlobal { acSubmissionNum { difficulty count } } } }","variables":{"username":"%s"}}
                """.formatted(username);

        JsonNode root = executeGraphQLQuery(query, username);
        JsonNode matchedUser = root.path("data").path("matchedUser");

        if (matchedUser.isMissingNode() || matchedUser.isNull()) {
            throw new LeetCodeApiException("LeetCode returned no stats data for user: " + username);
        }

        JsonNode submissionStats = matchedUser.path("submitStatsGlobal").path("acSubmissionNum");
        JsonNode beatsStats = matchedUser.path("problemsSolvedBeatsStats");
        List<ProblemStats> statsList = new ArrayList<>();

        if (submissionStats != null && submissionStats.isArray()) {
            for (JsonNode statNode : submissionStats) {
                String difficulty = statNode.path("difficulty").asString();
                int count = statNode.path("count").asInt();
                double percentage = 0.0;

                if (beatsStats != null && beatsStats.isArray()) {
                    for (JsonNode beatNode : beatsStats) {
                        if (beatNode.path("difficulty").asString().equals(difficulty) && !beatNode.path("percentage").isNull()) {
                            percentage = beatNode.path("percentage").asDouble();
                            break;
                        }
                    }
                }
                statsList.add(new ProblemStats(difficulty, count, percentage));
            }
        }

        // Cache for fallback
        cacheDataForFallback("leetcode:stats:" + username, statsList);
        return statsList;
    }

    /**
     * Fallback method when circuit is OPEN - serves stale stats from Redis
     */
    public List<ProblemStats> fetchProblemStatsFallback(String username, Exception ex) {
        log.warn("Circuit breaker OPEN for stats of {}. Serving stale data from cache. Error: {}",
                username, ex.getMessage());
        List<ProblemStats> cached = getFallbackDataFromCache("leetcode:stats:" + username, List.class);
        if (cached != null) {
            return cached;
        }
        throw new LeetCodeApiException("LeetCode API is temporarily unavailable and no cached data exists for user: " + username);
    }

    // 3. Fetch Recent Submissions Data
    @CircuitBreaker(name = "leetcodeApi", fallbackMethod = "fetchRecentSubmissionsFallback")
    @Retry(name = "leetcodeApi")
    @RateLimiter(name = "leetcodeApi")
    public List<RecentSubmission> fetchRecentSubmissions(String username, int limit) {
        String query = """
                {"query":"query recentAcSubmissions($username: String!, $limit: Int!) { recentAcSubmissionList(username: $username, limit: $limit) { id title titleSlug timestamp } }","variables":{"username":"%s","limit":%d}}
                """.formatted(username, limit);

        JsonNode root = executeGraphQLQuery(query, username);
        JsonNode submissionList = root.path("data").path("recentAcSubmissionList");

        if (submissionList.isMissingNode() || submissionList.isNull()) {
            log.warn("LeetCode returned no recent submissions for user: {}", username);
            return new ArrayList<>();
        }

        List<RecentSubmission> recentList = new ArrayList<>();
        if (submissionList.isArray()) {
            for (JsonNode node : submissionList) {
                try {
                    String title = node.path("title").asString();
                    String titleSlug = node.path("titleSlug").asString();
                    long timestamp = Long.parseLong(node.path("timestamp").asString());
                    recentList.add(new RecentSubmission(title, titleSlug, timestamp));
                } catch (Exception e) {
                    log.warn("Failed to parse recent submission entry for user {}: {}", username, e.getMessage());
                    // Continue parsing remaining entries
                }
            }
        }

        // Cache for fallback
        cacheDataForFallback("leetcode:recent:" + username, recentList);
        return recentList;
    }

    /**
     * Fallback method when circuit is OPEN - serves stale submissions from Redis
     */
    public List<RecentSubmission> fetchRecentSubmissionsFallback(String username, int limit, Exception ex) {
        log.warn("Circuit breaker OPEN for recent submissions of {}. Serving stale data from cache. Error: {}",
                username, ex.getMessage());
        List<RecentSubmission> cached = getFallbackDataFromCache("leetcode:recent:" + username, List.class);
        if (cached != null) {
            return cached;
        }
        throw new LeetCodeApiException("LeetCode API is temporarily unavailable and no cached data exists for user: " + username);
    }

    // 4. Fetch Extended Profile (Badges, Socials, Contests, Rank, About, AVATAR)
    @CircuitBreaker(name = "leetcodeApi", fallbackMethod = "fetchExtendedProfileDetailsFallback")
    @Retry(name = "leetcodeApi")
    @RateLimiter(name = "leetcodeApi")
    public Student fetchExtendedProfileDetails(String username) {
        // ADDED 'userAvatar' TO THE GRAPHQL QUERY
        String query = """
                {"query":"query fullProfile($username: String!) { matchedUser(username: $username) { githubUrl twitterUrl linkedinUrl profile { ranking aboutMe userAvatar } badges { name icon creationDate } } userContestRanking(username: $username) { rating } userContestRankingHistory(username: $username) { attended rating ranking problemsSolved totalProblems contest { title startTime } } }","variables":{"username":"%s"}}
                """.formatted(username);

        JsonNode root = executeGraphQLQuery(query, username);
        JsonNode data = root.path("data");

        if (data.path("matchedUser").isNull() || data.path("matchedUser").isMissingNode()) {
            throw new LeetCodeApiException("LeetCode returned no extended profile data for user: " + username);
        }

        Student extendedData = new Student();
        JsonNode matchedUser = data.path("matchedUser");
        JsonNode profile = matchedUser.path("profile");

        // 1. Parse Central Fields, Avatar, & Social Media
        extendedData.setAbout(profile.path("aboutMe").asString(null));
        extendedData.setRank(profile.path("ranking").asString("Unranked"));
        extendedData.setAvatarUrl(profile.path("userAvatar").asString(null)); // <-- CAPTURE THE AVATAR!

        extendedData.setSocialMedia(new SocialMedia(
                matchedUser.path("githubUrl").asString(null),
                matchedUser.path("linkedinUrl").asString(null),
                matchedUser.path("twitterUrl").asString(null)
        ));

        // Parse Current Contest Rating
        JsonNode rankingNode = data.path("userContestRanking");
        if (!rankingNode.isNull() && !rankingNode.isMissingNode()) {
            extendedData.setCurrentContestRating(rankingNode.path("rating").asDouble(0.0));
        }

        // 2. Parse Badges
        List<Badge> badgeList = new ArrayList<>();
        JsonNode badgesNode = matchedUser.path("badges");
        if (badgesNode != null && badgesNode.isArray()) {
            for (JsonNode b : badgesNode) {
                try {
                    badgeList.add(new Badge(
                            b.path("name").asString(),
                            b.path("icon").asString(),
                            b.path("creationDate").asString()
                    ));
                } catch (Exception e) {
                    log.warn("Failed to parse badge for user {}: {}", username, e.getMessage());
                }
            }
        }
        extendedData.setBadges(badgeList);

        // 3. Parse Contest History
        List<ContestHistory> historyList = new ArrayList<>();
        JsonNode historyNode = data.path("userContestRankingHistory");
        if (historyNode != null && historyNode.isArray()) {
            for (JsonNode c : historyNode) {
                try {
                    if (c.path("attended").asBoolean()) {
                        JsonNode contestMeta = c.path("contest");
                        historyList.add(new ContestHistory(
                                contestMeta.path("title").asString(),
                                contestMeta.path("startTime").asLong(),
                                c.path("rating").asDouble(),
                                c.path("ranking").asInt(),
                                c.path("problemsSolved").asInt(),
                                c.path("totalProblems").asInt()
                        ));
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse contest history entry for user {}: {}", username, e.getMessage());
                }
            }
        }
        extendedData.setContestHistory(historyList);

        // Cache for fallback
        cacheDataForFallback("leetcode:profile:" + username, extendedData);
        return extendedData;
    }

    /**
     * Fallback method when circuit is OPEN - serves stale profile from Redis
     */
    public Student fetchExtendedProfileDetailsFallback(String username, Exception ex) {
        log.warn("Circuit breaker OPEN for extended profile of {}. Serving stale data from cache. Error: {}",
                username, ex.getMessage());
        Student cached = getFallbackDataFromCache("leetcode:profile:" + username, Student.class);
        if (cached != null) {
            return cached;
        }
        throw new LeetCodeApiException("LeetCode API is temporarily unavailable and no cached data exists for user: " + username);
    }

    // 5. Verify Manual Submission URL (Bypassing Privacy Block)

    @CircuitBreaker(name = "leetcodeApi", fallbackMethod = "verifySubmissionFallback")
    @Retry(name = "leetcodeApi")
    @RateLimiter(name = "leetcodeApi")
    public boolean verifySubmission(String submissionId, String expectedUsername, String expectedTitleSlug) {
        if (submissionId == null || submissionId.isBlank() || expectedUsername == null || expectedUsername.isBlank()) {
            return false;
        }

        // Query their last 50 accepted submissions to see if the ID is in there
        String query = """
                {"query":"query recentAcSubmissions($username: String!, $limit: Int!) { recentAcSubmissionList(username: $username, limit: $limit) { id titleSlug } }","variables":{"username":"%s","limit":50}}
                """.formatted(expectedUsername);

        JsonNode root = executeGraphQLQuery(query, expectedUsername);
        JsonNode submissionList = root.path("data").path("recentAcSubmissionList");

        if (submissionList.isMissingNode() || submissionList.isNull() || !submissionList.isArray()) {
            log.warn("Could not fetch recent submissions or list is empty for user: {}", expectedUsername);
            return false;
        }

        try {
            String normExpectedSlug = expectedTitleSlug != null ? expectedTitleSlug.replaceAll("[^a-zA-Z0-9]", "").toLowerCase() : "";

            // Loop through their recent accepted submissions looking for a match
            for (JsonNode node : submissionList) {
                String actualId = node.path("id").asString();
                String actualSlug = node.path("titleSlug").asString();
                String normActualSlug = actualSlug.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();

                // If the ID matches AND the question matches, it's 100% valid!
                if (submissionId.trim().equals(actualId.trim()) &&
                        (normExpectedSlug.isEmpty() || normExpectedSlug.equals(normActualSlug) || expectedTitleSlug.equalsIgnoreCase(actualSlug))) {
                    log.info("Validation Successful -> Found ID: {} for Slug: {}", actualId, actualSlug);
                    return true;
                }
            }

            log.warn("Submission ID {} not found in the recent 50 Accepted submissions for {}.", submissionId, expectedUsername);
            return false;

        } catch (Exception e) {
            log.error("Failed to parse recent submissions array for validation: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Fallback for submission verification - returns false to deny verification during API outage
     */
    public boolean verifySubmissionFallback(String submissionId, String expectedUsername, String expectedTitleSlug, Exception ex) {
        log.warn("Circuit breaker OPEN for submission verification of {}. Denying verification during outage. Error: {}",
                expectedUsername, ex.getMessage());
        return false;
    }

    // 5b. Fetch Question Details (Problem Number & Official Title)
    public record LeetCodeQuestionInfo(String problemNumber, String title, String titleSlug, String difficulty) {}

    public LeetCodeQuestionInfo fetchQuestionDetails(String titleSlug) {
        if (titleSlug == null || titleSlug.isBlank()) return null;
        String cleanSlug = titleSlug.trim().toLowerCase();
        try {
            String query = """
                    {"query":"query questionData($titleSlug: String!) { question(titleSlug: $titleSlug) { questionFrontendId title titleSlug difficulty } }","variables":{"titleSlug":"%s"}}
                    """.formatted(cleanSlug);

            JsonNode root = executeGraphQLQuery(query, "questionDetails:" + cleanSlug);
            JsonNode qNode = root.path("data").path("question");
            if (qNode != null && !qNode.isMissingNode() && !qNode.isNull()) {
                String problemNumber = qNode.path("questionFrontendId").asString("");
                String title = qNode.path("title").asString("");
                String difficulty = qNode.path("difficulty").asString("");
                return new LeetCodeQuestionInfo(problemNumber, title, cleanSlug, difficulty);
            }
        } catch (Exception e) {
            log.warn("Could not fetch LeetCode question details for slug [{}]: {}", cleanSlug, e.getMessage());
        }
        return null;
    }

    // 6. Fetch Skill Stats (Topic Tags)
    @CircuitBreaker(name = "leetcodeApi", fallbackMethod = "fetchSkillStatsFallback")
    @Retry(name = "leetcodeApi")
    @RateLimiter(name = "leetcodeApi")
    public List<SkillStat> fetchSkillStats(String username) {
        // LeetCode's exact GraphQL query to get problems solved by topic tag
        String query = """
                {"query":"query skillStats($username: String!) { matchedUser(username: $username) { tagProblemCounts { advanced { tagName problemsSolved } intermediate { tagName problemsSolved } fundamental { tagName problemsSolved } } } }","variables":{"username":"%s"}}
                """.formatted(username);

        JsonNode root = executeGraphQLQuery(query, username);
        JsonNode tagCounts = root.path("data").path("matchedUser").path("tagProblemCounts");

        List<SkillStat> skills = new ArrayList<>();

        // If the user has a hidden profile or hasn't solved anything, return empty list
        if (tagCounts.isMissingNode() || tagCounts.isNull()) {
            log.debug("No skill data available for user: {}", username);
            return skills;
        }

        // LeetCode splits tags into 3 difficulty tiers. We will combine them all.
        String[] levels = {"fundamental", "intermediate", "advanced"};
        for (String level : levels) {
            JsonNode levelNode = tagCounts.path(level);
            if (levelNode != null && levelNode.isArray()) {
                for (JsonNode tag : levelNode) {
                    try {
                        skills.add(new SkillStat(
                                tag.path("tagName").asString(),
                                tag.path("problemsSolved").asInt()
                        ));
                    } catch (Exception e) {
                        log.warn("Failed to parse skill stat for level {} and user {}: {}", level, username, e.getMessage());
                    }
                }
            }
        }

        // Cache for fallback
        cacheDataForFallback("leetcode:skills:" + username, skills);
        return skills;
    }

    /**
     * Fallback method when circuit is OPEN - serves stale skills from Redis
     */
    public List<SkillStat> fetchSkillStatsFallback(String username, Exception ex) {
        log.warn("Circuit breaker OPEN for skill stats of {}. Serving stale data from cache. Error: {}",
                username, ex.getMessage());
        List<SkillStat> cached = getFallbackDataFromCache("leetcode:skills:" + username, List.class);
        if (cached != null) {
            return cached;
        }
        // Return empty list instead of throwing exception - skills are not critical
        log.info("No cached skill data available, returning empty list for: {}", username);
        return new ArrayList<>();
    }
}