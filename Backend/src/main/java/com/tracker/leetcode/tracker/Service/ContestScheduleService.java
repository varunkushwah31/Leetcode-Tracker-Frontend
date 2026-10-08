package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.UpcomingContestDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.time.*;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ContestScheduleService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final CacheManager cacheManager;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired(required = false)
    @Qualifier("virtualThreadExecutor")
    private Executor virtualThreadExecutor;

    @Autowired
    public ContestScheduleService(RedisTemplate<String, Object> redisTemplate,
                                  CacheManager cacheManager,
                                  @Autowired(required = false) RestTemplate restTemplate) {
        this.redisTemplate = redisTemplate;
        this.cacheManager = cacheManager;
        this.restTemplate = restTemplate != null ? restTemplate : new RestTemplate();
    }

    public ContestScheduleService(RedisTemplate<String, Object> redisTemplate, CacheManager cacheManager) {
        this(redisTemplate, cacheManager, null);
    }

    private Executor getExecutor() {
        return virtualThreadExecutor != null ? virtualThreadExecutor : Executors.newVirtualThreadPerTaskExecutor();
    }

    /**
     * Retrieves upcoming contests with global caching.
     * Cached globally in Redis under "upcoming-contests" with platform keys ("ALL", "LEETCODE", "CODEFORCES").
     * Shared across all users with a 30-minute TTL without user-level computation.
     */
    @Cacheable(value = "upcoming-contests", key = "#platformFilter != null && !#platformFilter.isBlank() ? #platformFilter.toUpperCase() : 'ALL'")
    public List<UpcomingContestDTO> getUpcomingContests(String platformFilter) {
        String filterKey = (platformFilter != null && !platformFilter.isBlank())
                ? platformFilter.trim().toUpperCase()
                : "ALL";

        if (cacheManager != null) {
            Cache cache = cacheManager.getCache("upcoming-contests");
            if (cache != null) {
                @SuppressWarnings("unchecked")
                List<UpcomingContestDTO> cached = cache.get(filterKey, List.class);
                if (cached != null && !cached.isEmpty()) {
                    log.debug("Global upcoming contests cache HIT for platform: {}", filterKey);
                    return cached;
                }
            }
        }

        log.info("Global upcoming contests cache MISS for platform: {}. Calculating and querying...", filterKey);
        List<UpcomingContestDTO> allContests = fetchAndCalculateAllContests();

        // Populate global caches for ALL, LEETCODE, and CODEFORCES simultaneously
        if (cacheManager != null) {
            Cache cache = cacheManager.getCache("upcoming-contests");
            if (cache != null) {
                cache.put("ALL", allContests);

                List<UpcomingContestDTO> lcList = allContests.stream()
                        .filter(c -> "LEETCODE".equalsIgnoreCase(c.getPlatform()))
                        .collect(Collectors.toList());
                cache.put("LEETCODE", lcList);

                List<UpcomingContestDTO> cfList = allContests.stream()
                        .filter(c -> "CODEFORCES".equalsIgnoreCase(c.getPlatform()))
                        .collect(Collectors.toList());
                cache.put("CODEFORCES", cfList);
                log.info("Cached global upcoming contests in Redis under 'upcoming-contests' for ALL, LEETCODE, and CODEFORCES.");
            }
        }

        if ("ALL".equalsIgnoreCase(filterKey)) {
            return allContests;
        }

        return allContests.stream()
                .filter(c -> filterKey.equalsIgnoreCase(c.getPlatform()))
                .collect(Collectors.toList());
    }

    public List<UpcomingContestDTO> getCachedOrFetchContests() {
        return getUpcomingContests("ALL");
    }

    public List<UpcomingContestDTO> fetchAndCalculateAllContests() {
        Executor executor = getExecutor();

        CompletableFuture<List<UpcomingContestDTO>> lcFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return calculateLeetCodeContests();
            } catch (Exception e) {
                log.error("Error calculating LeetCode upcoming contests: {}", e.getMessage(), e);
                return Collections.<UpcomingContestDTO>emptyList();
            }
        }, executor);

        CompletableFuture<List<UpcomingContestDTO>> cfFuture = CompletableFuture.supplyAsync(() -> {
            try {
                return fetchCodeforcesUpcomingContests();
            } catch (Exception e) {
                log.error("Error fetching Codeforces upcoming contests: {}", e.getMessage(), e);
                return Collections.<UpcomingContestDTO>emptyList();
            }
        }, executor);

        CompletableFuture.allOf(lcFuture, cfFuture).join();

        List<UpcomingContestDTO> results = new ArrayList<>();
        try {
            results.addAll(lcFuture.join());
        } catch (Exception e) {
            log.error("Error retrieving LeetCode contest results: {}", e.getMessage(), e);
        }

        try {
            results.addAll(cfFuture.join());
        } catch (Exception e) {
            log.error("Error retrieving Codeforces contest results: {}", e.getMessage(), e);
        }

        // Sort ascending by startTimeSeconds
        results.sort(Comparator.comparingLong(UpcomingContestDTO::getStartTimeSeconds));
        return results;
    }

    /**
     * Calculates the next upcoming LeetCode Weekly (every Sunday 02:30 UTC)
     * and Biweekly (alternate Saturday 14:30 UTC) contests.
     */
    public List<UpcomingContestDTO> calculateLeetCodeContests() {
        List<UpcomingContestDTO> list = new ArrayList<>();
        Instant now = Instant.now();
        ZoneId utc = ZoneOffset.UTC;
        ZonedDateTime utcNow = now.atZone(utc);

        // --- Weekly Contest (Every Sunday 02:30 UTC, 90 mins = 5400s) ---
        // Reference: Weekly Contest 419 on Sunday 2024-10-13 02:30 UTC
        LocalDate refSunday = LocalDate.of(2024, 10, 13);
        int refWeeklyNum = 419;

        // Find relevant Sundays (today if Sunday and not ended, plus upcoming)
        LocalDate candidateSunday = utcNow.toLocalDate();
        if (candidateSunday.getDayOfWeek() == DayOfWeek.SUNDAY) {
            ZonedDateTime sundayEnd = candidateSunday.atTime(4, 0).atZone(utc);
            if (utcNow.isAfter(sundayEnd)) {
                candidateSunday = candidateSunday.with(TemporalAdjusters.next(DayOfWeek.SUNDAY));
            }
        } else {
            candidateSunday = candidateSunday.with(TemporalAdjusters.next(DayOfWeek.SUNDAY));
        }

        // Generate next 2 weekly contests
        for (int i = 0; i < 2; i++) {
            LocalDate sunday = candidateSunday.plusWeeks(i);
            ZonedDateTime startTime = sunday.atTime(2, 30).atZone(utc);
            long startSec = startTime.toEpochSecond();
            long durationSec = 5400; // 90 min

            long weeksDiff = ChronoUnit.WEEKS.between(refSunday, sunday);
            int contestNum = refWeeklyNum + (int) weeksDiff;

            String phase = "BEFORE";
            if (now.getEpochSecond() >= startSec && now.getEpochSecond() < startSec + durationSec) {
                phase = "CODING";
            }

            list.add(UpcomingContestDTO.builder()
                    .id("LC-WEEKLY-" + contestNum)
                    .platform("LEETCODE")
                    .title("LeetCode Weekly Contest " + contestNum)
                    .startTimeSeconds(startSec)
                    .durationSeconds(durationSec)
                    .url("https://leetcode.com/contest/weekly-contest-" + contestNum)
                    .phase(phase)
                    .build());
        }

        // --- Biweekly Contest (Alternate Saturday 14:30 UTC, 90 mins = 5400s) ---
        // Reference: Biweekly Contest 141 on Saturday 2024-10-12 14:30 UTC
        LocalDate refSaturday = LocalDate.of(2024, 10, 12);
        int refBiweeklyNum = 141;

        LocalDate candidateSaturday = utcNow.toLocalDate();
        if (candidateSaturday.getDayOfWeek() == DayOfWeek.SATURDAY) {
            ZonedDateTime satEnd = candidateSaturday.atTime(16, 0).atZone(utc);
            if (utcNow.isAfter(satEnd)) {
                candidateSaturday = candidateSaturday.with(TemporalAdjusters.next(DayOfWeek.SATURDAY));
            }
        } else {
            candidateSaturday = candidateSaturday.with(TemporalAdjusters.next(DayOfWeek.SATURDAY));
        }

        // Search for the next 2 biweekly Saturdays (where days between refSaturday and sat is divisible by 14)
        int found = 0;
        LocalDate curSat = candidateSaturday;
        while (found < 2) {
            long daysDiff = ChronoUnit.DAYS.between(refSaturday, curSat);
            if (daysDiff >= 0 && daysDiff % 14 == 0) {
                ZonedDateTime startTime = curSat.atTime(14, 30).atZone(utc);
                long startSec = startTime.toEpochSecond();
                long durationSec = 5400;
                int contestNum = refBiweeklyNum + (int) (daysDiff / 14);

                String phase = "BEFORE";
                if (now.getEpochSecond() >= startSec && now.getEpochSecond() < startSec + durationSec) {
                    phase = "CODING";
                }

                list.add(UpcomingContestDTO.builder()
                        .id("LC-BIWEEKLY-" + contestNum)
                        .platform("LEETCODE")
                        .title("LeetCode Biweekly Contest " + contestNum)
                        .startTimeSeconds(startSec)
                        .durationSeconds(durationSec)
                        .url("https://leetcode.com/contest/biweekly-contest-" + contestNum)
                        .phase(phase)
                        .build());
                found++;
            }
            curSat = curSat.plusWeeks(1);
        }

        // Return strictly the 2 latest/nearest upcoming LeetCode contests
        return list.stream()
                .sorted(Comparator.comparingLong(UpcomingContestDTO::getStartTimeSeconds))
                .limit(2)
                .collect(Collectors.toList());
    }

    /**
     * Queries Codeforces API (https://codeforces.com/api/contest.list?gym=false)
     * and filters for contests that are upcoming or currently live.
     */
    public List<UpcomingContestDTO> fetchCodeforcesUpcomingContests() {
        List<UpcomingContestDTO> list = new ArrayList<>();
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set(HttpHeaders.USER_AGENT, "MentorSync-Tracker/1.0 (Contest schedule fetcher)");
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    "https://codeforces.com/api/contest.list?gym=false",
                    HttpMethod.GET,
                    request,
                    String.class
            );

            if (response.getBody() == null || response.getBody().isBlank()) {
                return list;
            }

            JsonNode root = objectMapper.readTree(response.getBody());
            String status = root.path("status").asText();
            if (!"OK".equalsIgnoreCase(status)) {
                return list;
            }

            JsonNode contests = root.path("result");
            if (contests.isArray()) {
                for (JsonNode c : contests) {
                    String phase = c.path("phase").asText("");
                    if ("BEFORE".equalsIgnoreCase(phase) || "CODING".equalsIgnoreCase(phase)) {
                        int id = c.path("id").asInt();
                        String name = c.path("name").asText("Codeforces Contest " + id);
                        long duration = c.path("durationSeconds").asLong(7200);
                        long startTime = c.path("startTimeSeconds").asLong(0);

                        // If upcoming (BEFORE), direct user to contest registration page
                        String contestUrl = "BEFORE".equalsIgnoreCase(phase)
                                ? "https://codeforces.com/contestRegistration/" + id
                                : "https://codeforces.com/contest/" + id;

                        list.add(UpcomingContestDTO.builder()
                                .id("CF-" + id)
                                .platform("CODEFORCES")
                                .title(name)
                                .startTimeSeconds(startTime)
                                .durationSeconds(duration)
                                .url(contestUrl)
                                .phase(phase.toUpperCase())
                                .build());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch contest list from Codeforces API: {}", e.getMessage());
        }
        return list;
    }
}
