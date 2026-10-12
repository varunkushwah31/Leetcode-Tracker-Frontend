package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.Exception.CodeforcesApiException;
import com.tracker.leetcode.tracker.Models.*;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.ratelimiter.annotation.RateLimiter;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class CodeforcesApiClient {

    private static final String BASE_URL = "https://codeforces.com/api";
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpHeaders headers;
    private final RedisTemplate<String, Object> redisTemplate;

    public CodeforcesApiClient(RedisTemplate<String, Object> redisTemplate) {
        this(redisTemplate, new RestTemplate());
    }

    @org.springframework.beans.factory.annotation.Autowired
    public CodeforcesApiClient(RedisTemplate<String, Object> redisTemplate, RestTemplate restTemplate) {
        this.redisTemplate = redisTemplate;
        this.restTemplate = restTemplate;
        this.headers = new HttpHeaders();
        this.headers.set(HttpHeaders.USER_AGENT, "MentorSync-Tracker/1.0 (Educational competitive programming tracker)");
    }

    private JsonNode executeGetRequest(String endpoint, String identifier) {
        try {
            HttpEntity<Void> request = new HttpEntity<>(headers);
            ResponseEntity<String> response = restTemplate.exchange(
                    BASE_URL + endpoint,
                    HttpMethod.GET,
                    request,
                    String.class
            );

            if (response.getBody() == null || response.getBody().isBlank()) {
                throw new CodeforcesApiException("Empty response from Codeforces API for: " + identifier);
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            String status = root.path("status").asString();
            if (!"OK".equalsIgnoreCase(status)) {
                String comment = root.path("comment").asString("Unknown Codeforces API error");
                throw new CodeforcesApiException("Codeforces API error for " + identifier + ": " + comment);
            }

            return root.path("result");
        } catch (CodeforcesApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Network or parsing error communicating with Codeforces API for {}: {}", identifier, e.getMessage());
            throw new CodeforcesApiException("Failed to communicate with Codeforces servers for: " + identifier);
        }
    }

    private void cacheDataForFallback(String key, Object data) {
        try {
            redisTemplate.opsForValue().set(key, data, 7, TimeUnit.DAYS);
            log.debug("Data cached in Redis for fallback: {}", key);
        } catch (Exception e) {
            log.warn("Failed to cache Codeforces data for fallback: {}", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private <T> T getFallbackDataFromCache(String key, Class<T> type) {
        try {
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                log.info("Using fallback Codeforces data from Redis cache: {}", key);
                return (T) cached;
            }
        } catch (Exception e) {
            log.warn("Failed to retrieve Codeforces fallback data from cache: {}", e.getMessage());
        }
        return null;
    }

    // 1. Fetch User Info (Rating, Rank, Avatar, etc.)
    @CircuitBreaker(name = "codeforcesApi", fallbackMethod = "fetchUserInfoFallback")
    @Retry(name = "codeforcesApi")
    @RateLimiter(name = "codeforcesApi")
    public Student fetchUserInfo(String handle) {
        if (handle == null || handle.isBlank()) {
            return new Student();
        }

        JsonNode result = executeGetRequest("/user.info?handles=" + handle.trim(), handle);
        if (!result.isArray() || result.isEmpty()) {
            throw new CodeforcesApiException("No profile returned from Codeforces for handle: " + handle);
        }

        JsonNode userNode = result.get(0);
        Student student = new Student();
        student.setCodeforcesHandle(userNode.path("handle").asString(handle));
        student.setCodeforcesRating(userNode.path("rating").asInt(0));
        student.setCodeforcesMaxRating(userNode.path("maxRating").asInt(0));
        student.setCodeforcesRank(userNode.path("rank").asString("unrated"));
        student.setCodeforcesMaxRank(userNode.path("maxRank").asString("unrated"));

        String avatar = userNode.path("titlePhoto").asString(null);
        if (avatar == null || avatar.isBlank() || avatar.contains("no-title")) {
            avatar = userNode.path("avatar").asString(null);
        }
        student.setCodeforcesAvatarUrl(avatar);

        cacheDataForFallback("codeforces:profile:" + handle.toLowerCase(), student);
        return student;
    }

    public Student fetchUserInfoFallback(String handle, Exception ex) {
        log.warn("Circuit breaker OPEN for Codeforces user info of {}. Serving stale data from cache. Error: {}",
                handle, ex.getMessage());
        Student cached = getFallbackDataFromCache("codeforces:profile:" + handle.toLowerCase(), Student.class);
        if (cached != null) {
            return cached;
        }
        throw new CodeforcesApiException("Codeforces API is temporarily unavailable and no cached data exists for handle: " + handle);
    }

    // 2. Fetch Contest History
    @CircuitBreaker(name = "codeforcesApi", fallbackMethod = "fetchContestHistoryFallback")
    @Retry(name = "codeforcesApi")
    @RateLimiter(name = "codeforcesApi")
    public List<CodeforcesContestHistory> fetchContestHistory(String handle) {
        if (handle == null || handle.isBlank()) {
            return Collections.emptyList();
        }

        JsonNode result = executeGetRequest("/user.rating?handle=" + handle.trim(), handle);
        List<CodeforcesContestHistory> history = new ArrayList<>();

        if (result != null && result.isArray()) {
            for (JsonNode node : result) {
                try {
                    history.add(CodeforcesContestHistory.builder()
                            .contestId(node.path("contestId").asInt())
                            .contestName(node.path("contestName").asString())
                            .rank(node.path("rank").asInt())
                            .oldRating(node.path("oldRating").asInt())
                            .newRating(node.path("newRating").asInt())
                            .ratingUpdateTimeSeconds(node.path("ratingUpdateTimeSeconds").asLong())
                            .build());
                } catch (Exception e) {
                    log.warn("Failed to parse contest entry for Codeforces handle {}: {}", handle, e.getMessage());
                }
            }
        }

        cacheDataForFallback("codeforces:contests:" + handle.toLowerCase(), history);
        return history;
    }

    @SuppressWarnings("unchecked")
    public List<CodeforcesContestHistory> fetchContestHistoryFallback(String handle, Exception ex) {
        log.warn("Circuit breaker OPEN for Codeforces contest history of {}. Serving stale data. Error: {}",
                handle, ex.getMessage());
        List<CodeforcesContestHistory> cached = getFallbackDataFromCache("codeforces:contests:" + handle.toLowerCase(), List.class);
        if (cached != null) {
            return cached;
        }
        return Collections.emptyList();
    }

    // 3. Fetch Submissions (Accepted Problems, Daily Activity, Topic Skills)
    public record CodeforcesSubmissionData(
            int solvedCount,
            List<RecentSubmission> recentSubmissions,
            Map<LocalDate, Integer> dailyActivity,
            List<SkillStat> skills
    ) {}

    @CircuitBreaker(name = "codeforcesApi", fallbackMethod = "fetchSubmissionsFallback")
    @Retry(name = "codeforcesApi")
    @RateLimiter(name = "codeforcesApi")
    public CodeforcesSubmissionData fetchSubmissions(String handle) {
        return fetchSubmissions(handle, 0);
    }

    @CircuitBreaker(name = "codeforcesApi", fallbackMethod = "fetchSubmissionsFallback")
    @Retry(name = "codeforcesApi")
    @RateLimiter(name = "codeforcesApi")
    public CodeforcesSubmissionData fetchSubmissions(String handle, int count) {
        if (handle == null || handle.isBlank()) {
            return new CodeforcesSubmissionData(0, Collections.emptyList(), Collections.emptyMap(), Collections.emptyList());
        }

        // When count <= 0, query without from/count parameters so Codeforces returns the user's FULL submission history
        String endpoint = "/user.status?handle=" + handle.trim();
        if (count > 0) {
            endpoint += "&from=1&count=" + count;
        }
        JsonNode result = executeGetRequest(endpoint, handle);

        Set<String> uniqueSolvedSlugs = new HashSet<>();
        List<RecentSubmission> submissions = new ArrayList<>();
        Map<LocalDate, Integer> dailyMap = new HashMap<>();
        Map<String, Integer> tagCounts = new HashMap<>();

        if (result != null && result.isArray()) {
            for (JsonNode subNode : result) {
                try {
                    String verdict = subNode.path("verdict").asString("");
                    JsonNode problem = subNode.path("problem");
                    int contestId = problem.path("contestId").asInt(0);
                    String index = problem.path("index").asString("");
                    String name = problem.path("name").asString("");
                    long creationTime = subNode.path("creationTimeSeconds").asLong();

                    String problemSlug;
                    if (contestId > 0 && !index.isBlank()) {
                        problemSlug = contestId + index.toUpperCase();
                    } else if (problem.has("problemsetName") && !index.isBlank()) {
                        problemSlug = problem.path("problemsetName").asString() + "_" + index.toUpperCase();
                    } else if (!name.isBlank()) {
                        problemSlug = name.trim();
                    } else {
                        continue;
                    }

                    String questionLink = contestId > 0 && !index.isBlank()
                            ? "https://codeforces.com/problemset/problem/" + contestId + "/" + index.toUpperCase()
                            : "https://codeforces.com/problemset";

                    // Only count accepted solutions ("OK")
                    if ("OK".equalsIgnoreCase(verdict)) {
                        boolean isFirstTimeSolved = uniqueSolvedSlugs.add(problemSlug);

                        // Heatmap daily activity
                        if (creationTime > 0) {
                            LocalDate date = Instant.ofEpochSecond(creationTime)
                                    .atZone(ZoneId.systemDefault())
                                    .toLocalDate();
                            dailyMap.merge(date, 1, Integer::sum);
                        }

                        // Collect tags/skills per unique solved problem
                        if (isFirstTimeSolved) {
                            JsonNode tagsNode = problem.path("tags");
                            if (tagsNode.isArray()) {
                                for (JsonNode tag : tagsNode) {
                                    tagCounts.merge(tag.asString(), 1, Integer::sum);
                                }
                            }
                        }

                        // Add to recent submissions (keep top 20)
                        if (submissions.size() < 20) {
                            submissions.add(new RecentSubmission(
                                    name,
                                    problemSlug,
                                    creationTime,
                                    Platform.CODEFORCES,
                                    questionLink
                            ));
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse Codeforces submission for {}: {}", handle, e.getMessage());
                }
            }
        }

        List<SkillStat> skills = tagCounts.entrySet().stream()
                .map(e -> new SkillStat(e.getKey(), e.getValue()))
                .sorted((a, b) -> Integer.compare(b.getProblemsSolved(), a.getProblemsSolved()))
                .toList();

        CodeforcesSubmissionData data = new CodeforcesSubmissionData(
                uniqueSolvedSlugs.size(),
                submissions,
                dailyMap,
                skills
        );

        cacheDataForFallback("codeforces:submissions:" + handle.toLowerCase(), data);
        return data;
    }

    public CodeforcesSubmissionData fetchSubmissionsFallback(String handle, Exception ex) {
        return fetchSubmissionsFallback(handle, 0, ex);
    }

    public CodeforcesSubmissionData fetchSubmissionsFallback(String handle, int count, Exception ex) {
        log.warn("Circuit breaker OPEN for Codeforces submissions of {}. Serving stale data. Error: {}",
                handle, ex.getMessage());
        CodeforcesSubmissionData cached = getFallbackDataFromCache("codeforces:submissions:" + handle.toLowerCase(), CodeforcesSubmissionData.class);
        if (cached != null) {
            return cached;
        }
        return new CodeforcesSubmissionData(0, Collections.emptyList(), Collections.emptyMap(), Collections.emptyList());
    }

    // 4. Verify Codeforces Submission URL or Auto-Check Problem Completion
    public boolean verifySubmission(String handle, String problemIdentifier, String submissionUrl) {
        if (handle == null || handle.isBlank()) {
            return false;
        }

        // Normalize expected problem identifier (e.g. "4A" or "4/A" or "4")
        String normalizedTarget = normalizeProblemIdentifier(problemIdentifier);

        // If a direct submission URL is provided, extract submissionId and contestId
        String targetSubmissionId = null;
        Integer targetContestId = null;

        if (submissionUrl != null && !submissionUrl.isBlank()) {
            Pattern cfUrlPattern = Pattern.compile("(?i)(?:contest|gym|problemset/submission)/(\\d+)/(?:submission/)?(\\d+)");
            Matcher matcher = cfUrlPattern.matcher(submissionUrl.trim());
            if (matcher.find()) {
                targetContestId = Integer.parseInt(matcher.group(1));
                targetSubmissionId = matcher.group(2);
                log.info("Validating Codeforces submission URL {} -> Contest: {}, Submission: {} for handle: {}",
                        submissionUrl, targetContestId, targetSubmissionId, handle);
            } else {
                throw new com.tracker.leetcode.tracker.Exception.ValidationFailedException(
                        "Invalid Codeforces submission URL format. Expected: https://codeforces.com/contest/{contestId}/submission/{submissionId}");
            }
        }

        // Query the user's latest 200 submissions on Codeforces
        try {
            JsonNode result = executeGetRequest("/user.status?handle=" + handle.trim() + "&from=1&count=200", handle);
            if (result != null && result.isArray()) {
                boolean submissionIdFound = false;

                for (JsonNode subNode : result) {
                    long id = subNode.path("id").asLong(0);
                    String verdict = subNode.path("verdict").asString("");
                    JsonNode problem = subNode.path("problem");
                    int contestId = problem.path("contestId").asInt(0);
                    String index = problem.path("index").asString("");
                    String currentSlug = contestId + index.toUpperCase();

                    // If manual submission validation (URL provided):
                    if (targetSubmissionId != null) {
                        if (String.valueOf(id).equals(targetSubmissionId)) {
                            submissionIdFound = true;

                            if (!"OK".equalsIgnoreCase(verdict)) {
                                throw new com.tracker.leetcode.tracker.Exception.ValidationFailedException(
                                        "Submission #" + targetSubmissionId + " was not accepted! Verdict on Codeforces was: " + verdict);
                            }

                            if (!currentSlug.equalsIgnoreCase(normalizedTarget) &&
                                    !(index.equalsIgnoreCase(normalizedTarget) && contestId > 0)) {
                                throw new com.tracker.leetcode.tracker.Exception.ValidationFailedException(
                                        "Submission #" + targetSubmissionId + " is for problem " + currentSlug +
                                                ", but this assignment is for problem " + problemIdentifier + ".");
                            }

                            log.info("Codeforces Manual Validation Successful -> Submission: {} for {} on problem {}",
                                    targetSubmissionId, handle, currentSlug);
                            return true;
                        }
                    } else {
                        // Auto-validation (no submission URL provided - match any recent accepted submission)
                        if ("OK".equalsIgnoreCase(verdict)) {
                            if (currentSlug.equalsIgnoreCase(normalizedTarget) ||
                                    (index.equalsIgnoreCase(normalizedTarget) && contestId > 0)) {
                                log.info("Codeforces Auto-Validation Successful -> Found accepted submission for {} on problem {}",
                                        handle, currentSlug);
                                return true;
                            }
                        }
                    }
                }

                if (targetSubmissionId != null && !submissionIdFound) {
                    throw new com.tracker.leetcode.tracker.Exception.ValidationFailedException(
                            "Submission #" + targetSubmissionId + " was not found among recent submissions for Codeforces handle @" +
                                    handle + ". Please verify this submission belongs to your account.");
                }
            }
        } catch (com.tracker.leetcode.tracker.Exception.ValidationFailedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error verifying Codeforces submission for {}: {}", handle, e.getMessage());
        }

        log.warn("Codeforces submission not verified for handle {} and problem {}", handle, problemIdentifier);
        return false;
    }

    // 5. Fetch Problem Details (Problem Name, Rating)
    public record CodeforcesProblemInfo(String problemNumber, String title, int contestId, String index, int rating) {}

    public CodeforcesProblemInfo fetchProblemDetails(int contestId, String index) {
        if (contestId <= 0 || index == null || index.isBlank()) return null;
        String cleanIndex = index.trim().toUpperCase();
        try {
            JsonNode result = executeGetRequest("/contest.standings?contestId=" + contestId + "&from=1&count=1", "contest:" + contestId);
            if (result != null) {
                JsonNode problems = result.path("problems");
                if (problems != null && problems.isArray()) {
                    for (JsonNode pNode : problems) {
                        String pIndex = pNode.path("index").asString("");
                        if (cleanIndex.equalsIgnoreCase(pIndex)) {
                            String name = pNode.path("name").asString("");
                            int rating = pNode.path("rating").asInt(0);
                            String problemNumber = contestId + cleanIndex;
                            return new CodeforcesProblemInfo(problemNumber, name, contestId, cleanIndex, rating);
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch Codeforces problem details for {}{}: {}", contestId, cleanIndex, e.getMessage());
        }
        return null;
    }

    public static String normalizeProblemIdentifier(String input) {
        if (input == null) return "";
        return input.trim().replace("/", "").replace("-", "").toUpperCase();
    }

    public record CodeforcesDailyPick(
            String title,
            int contestId,
            String index,
            int rating,
            String url,
            List<String> tags
    ) {}

    public CodeforcesDailyPick fetchDailyPick() {
        String todayKey = "codeforces:daily:challenge:" + LocalDate.now(ZoneId.of("UTC")).toString();
        CodeforcesDailyPick cached = getFallbackDataFromCache(todayKey, CodeforcesDailyPick.class);
        if (cached != null) {
            return cached;
        }

        List<CodeforcesDailyPick> curatedPicks = List.of(
                new CodeforcesDailyPick("Watermelon", 4, "A", 800, "https://codeforces.com/problemset/problem/4/A", List.of("brute force", "math")),
                new CodeforcesDailyPick("Way Too Long Words", 71, "A", 800, "https://codeforces.com/problemset/problem/71/A", List.of("strings")),
                new CodeforcesDailyPick("Next Round", 158, "A", 800, "https://codeforces.com/problemset/problem/158/A", List.of("special problem", "implementation")),
                new CodeforcesDailyPick("Domino piling", 50, "A", 800, "https://codeforces.com/problemset/problem/50/A", List.of("greedy", "math")),
                new CodeforcesDailyPick("Beautiful Matrix", 263, "A", 800, "https://codeforces.com/problemset/problem/263/A", List.of("implementation")),
                new CodeforcesDailyPick("Theatre Square", 1, "A", 1000, "https://codeforces.com/problemset/problem/1/A", List.of("math")),
                new CodeforcesDailyPick("Young Physicist", 69, "A", 1000, "https://codeforces.com/problemset/problem/69/A", List.of("math", "implementation")),
                new CodeforcesDailyPick("Chat room", 58, "A", 1000, "https://codeforces.com/problemset/problem/58/A", List.of("greedy", "strings")),
                new CodeforcesDailyPick("String Task", 118, "A", 1000, "https://codeforces.com/problemset/problem/118/A", List.of("implementation", "strings")),
                new CodeforcesDailyPick("Interesting drink", 706, "B", 1100, "https://codeforces.com/problemset/problem/706/B", List.of("binary search", "dp")),
                new CodeforcesDailyPick("Taxi", 158, "B", 1100, "https://codeforces.com/problemset/problem/158/B", List.of("greedy", "special problem")),
                new CodeforcesDailyPick("Fancy Fence", 270, "A", 1100, "https://codeforces.com/problemset/problem/270/A", List.of("geometry", "math")),
                new CodeforcesDailyPick("Vanya and Lanterns", 492, "B", 1200, "https://codeforces.com/problemset/problem/492/B", List.of("binary search", "math", "sortings")),
                new CodeforcesDailyPick("Chewbaсca and Number", 514, "A", 1200, "https://codeforces.com/problemset/problem/514/A", List.of("greedy")),
                new CodeforcesDailyPick("Worms", 474, "B", 1200, "https://codeforces.com/problemset/problem/474/B", List.of("binary search", "implementation")),
                new CodeforcesDailyPick("Registration System", 4, "C", 1300, "https://codeforces.com/problemset/problem/4/C", List.of("data structures", "hashing")),
                new CodeforcesDailyPick("Cut Ribbon", 189, "A", 1300, "https://codeforces.com/problemset/problem/189/A", List.of("dp")),
                new CodeforcesDailyPick("T-primes", 230, "B", 1300, "https://codeforces.com/problemset/problem/230/B", List.of("binary search", "math", "number theory")),
                new CodeforcesDailyPick("Given Length and Sum of Digits...", 489, "C", 1400, "https://codeforces.com/problemset/problem/489/C", List.of("dp", "greedy")),
                new CodeforcesDailyPick("Two Substrings", 550, "A", 1500, "https://codeforces.com/problemset/problem/550/A", List.of("brute force", "dp", "greedy", "strings"))
        );

        int dayOfYear = LocalDate.now(ZoneId.of("UTC")).getDayOfYear();
        CodeforcesDailyPick pick = curatedPicks.get(dayOfYear % curatedPicks.size());
        cacheDataForFallback(todayKey, pick);
        return pick;
    }
}
