package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.UpcomingContestDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContestScheduleService {

    private static final String UPCOMING_CONTESTS_CACHE_KEY = "cache:upcoming-contests";
    private static final long CACHE_TTL_MINUTES = 30;

    private final RedisTemplate<String, Object> redisTemplate;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<UpcomingContestDTO> getUpcomingContests(String platformFilter) {
        List<UpcomingContestDTO> allContests = getCachedOrFetchContests();

        if (platformFilter == null || platformFilter.isBlank() || "ALL".equalsIgnoreCase(platformFilter)) {
            return allContests;
        }

        String filterUpper = platformFilter.trim().toUpperCase();
        return allContests.stream()
                .filter(c -> filterUpper.equalsIgnoreCase(c.getPlatform()))
                .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    public List<UpcomingContestDTO> getCachedOrFetchContests() {
        try {
            Object cached = redisTemplate.opsForValue().get(UPCOMING_CONTESTS_CACHE_KEY);
            if (cached instanceof List<?>) {
                List<?> list = (List<?>) cached;
                if (!list.isEmpty() && list.get(0) instanceof UpcomingContestDTO) {
                    return (List<UpcomingContestDTO>) list;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to retrieve upcoming contests from Redis: {}", e.getMessage());
        }

        List<UpcomingContestDTO> contests = fetchAndCalculateAllContests();

        try {
            redisTemplate.opsForValue().set(UPCOMING_CONTESTS_CACHE_KEY, contests, CACHE_TTL_MINUTES, TimeUnit.MINUTES);
        } catch (Exception e) {
            log.warn("Failed to cache upcoming contests in Redis: {}", e.getMessage());
        }

        return contests;
    }

    public List<UpcomingContestDTO> fetchAndCalculateAllContests() {
        List<UpcomingContestDTO> results = new ArrayList<>();

        // 1. Calculate upcoming LeetCode Contests
        try {
            results.addAll(calculateLeetCodeContests());
        } catch (Exception e) {
            log.error("Error calculating LeetCode upcoming contests: {}", e.getMessage(), e);
        }

        // 2. Fetch Codeforces upcoming contests
        try {
            results.addAll(fetchCodeforcesUpcomingContests());
        } catch (Exception e) {
            log.error("Error fetching Codeforces upcoming contests: {}", e.getMessage(), e);
        }

        // 3. Sort ascending by startTimeSeconds
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

        return list;
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

                        list.add(UpcomingContestDTO.builder()
                                .id("CF-" + id)
                                .platform("CODEFORCES")
                                .title(name)
                                .startTimeSeconds(startTime)
                                .durationSeconds(duration)
                                .url("https://codeforces.com/contest/" + id)
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
