package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.CuratedProblemDTO;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class CuratedTopicCatalog {

    public static final String PLATFORM_LEETCODE = "LEETCODE";
    public static final String DIFF_EASY = "Easy";
    public static final String DIFF_MEDIUM = "Medium";

    public static final String TOPIC_DP = "Dynamic Programming";
    public static final String TOPIC_TREE = "Tree";
    public static final String TOPIC_GRAPH = "Graph";
    public static final String TOPIC_BINARY_SEARCH = "Binary Search";
    public static final String TOPIC_TWO_POINTERS = "Two Pointers";
    public static final String TOPIC_SLIDING_WINDOW = "Sliding Window";
    public static final String TOPIC_STACK = "Stack";
    public static final String TOPIC_HEAP = "Heap";
    public static final String TOPIC_BACKTRACKING = "Backtracking";
    public static final String TOPIC_LINKED_LIST = "Linked List";
    public static final String TOPIC_HASH_TABLE = "Hash Table";
    public static final String TOPIC_GREEDY = "Greedy";

    private static final Map<String, List<CuratedProblemDTO>> TOPIC_CATALOG = new HashMap<>();

    static {
        // 1. Dynamic Programming
        registerTopic(List.of(TOPIC_DP, "dp"), List.of(
                CuratedProblemDTO.builder()
                        .title("Climbing Stairs")
                        .titleSlug("climbing-stairs")
                        .difficulty(DIFF_EASY)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_DP)
                        .link("https://leetcode.com/problems/climbing-stairs/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Coin Change")
                        .titleSlug("coin-change")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_DP)
                        .link("https://leetcode.com/problems/coin-change/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Longest Increasing Subsequence")
                        .titleSlug("longest-increasing-subsequence")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_DP)
                        .link("https://leetcode.com/problems/longest-increasing-subsequence/")
                        .build()
        ));

        // 2. Tree / Binary Tree
        registerTopic(List.of(TOPIC_TREE, "Binary Tree", "Binary Search Tree"), List.of(
                CuratedProblemDTO.builder()
                        .title("Maximum Depth of Binary Tree")
                        .titleSlug("maximum-depth-of-binary-tree")
                        .difficulty(DIFF_EASY)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_TREE)
                        .link("https://leetcode.com/problems/maximum-depth-of-binary-tree/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Binary Tree Level Order Traversal")
                        .titleSlug("binary-tree-level-order-traversal")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_TREE)
                        .link("https://leetcode.com/problems/binary-tree-level-order-traversal/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Lowest Common Ancestor of a Binary Tree")
                        .titleSlug("lowest-common-ancestor-of-a-binary-tree")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_TREE)
                        .link("https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/")
                        .build()
        ));

        // 3. Graph
        registerTopic(List.of(TOPIC_GRAPH, "Breadth-First Search", "Depth-First Search", "dfs", "bfs"), List.of(
                CuratedProblemDTO.builder()
                        .title("Number of Islands")
                        .titleSlug("number-of-islands")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_GRAPH)
                        .link("https://leetcode.com/problems/number-of-islands/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Clone Graph")
                        .titleSlug("clone-graph")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_GRAPH)
                        .link("https://leetcode.com/problems/clone-graph/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Course Schedule")
                        .titleSlug("course-schedule")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_GRAPH)
                        .link("https://leetcode.com/problems/course-schedule/")
                        .build()
        ));

        // 4. Binary Search
        registerTopic(List.of(TOPIC_BINARY_SEARCH), List.of(
                CuratedProblemDTO.builder()
                        .title(TOPIC_BINARY_SEARCH)
                        .titleSlug("binary-search")
                        .difficulty(DIFF_EASY)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_BINARY_SEARCH)
                        .link("https://leetcode.com/problems/binary-search/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Search in Rotated Sorted Array")
                        .titleSlug("search-in-rotated-sorted-array")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_BINARY_SEARCH)
                        .link("https://leetcode.com/problems/search-in-rotated-sorted-array/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Koko Eating Bananas")
                        .titleSlug("koko-eating-bananas")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_BINARY_SEARCH)
                        .link("https://leetcode.com/problems/koko-eating-bananas/")
                        .build()
        ));

        // 5. Two Pointers
        registerTopic(List.of(TOPIC_TWO_POINTERS, "two pointers"), List.of(
                CuratedProblemDTO.builder()
                        .title("Valid Palindrome")
                        .titleSlug("valid-palindrome")
                        .difficulty(DIFF_EASY)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_TWO_POINTERS)
                        .link("https://leetcode.com/problems/valid-palindrome/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Two Sum II - Input Array Is Sorted")
                        .titleSlug("two-sum-ii-input-array-is-sorted")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_TWO_POINTERS)
                        .link("https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Container With Most Water")
                        .titleSlug("container-with-most-water")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_TWO_POINTERS)
                        .link("https://leetcode.com/problems/container-with-most-water/")
                        .build()
        ));

        // 6. Sliding Window
        registerTopic(List.of(TOPIC_SLIDING_WINDOW), List.of(
                CuratedProblemDTO.builder()
                        .title("Best Time to Buy and Sell Stock")
                        .titleSlug("best-time-to-buy-and-sell-stock")
                        .difficulty(DIFF_EASY)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_SLIDING_WINDOW)
                        .link("https://leetcode.com/problems/best-time-to-buy-and-sell-stock/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Longest Substring Without Repeating Characters")
                        .titleSlug("longest-substring-without-repeating-characters")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_SLIDING_WINDOW)
                        .link("https://leetcode.com/problems/longest-substring-without-repeating-characters/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Minimum Window Substring")
                        .titleSlug("minimum-window-substring")
                        .difficulty("Hard")
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_SLIDING_WINDOW)
                        .link("https://leetcode.com/problems/minimum-window-substring/")
                        .build()
        ));

        // 7. Stack & Queue
        registerTopic(List.of(TOPIC_STACK, "Monotonic Stack", "Queue", "Monotonic Queue"), List.of(
                CuratedProblemDTO.builder()
                        .title("Valid Parentheses")
                        .titleSlug("valid-parentheses")
                        .difficulty(DIFF_EASY)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_STACK)
                        .link("https://leetcode.com/problems/valid-parentheses/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Min Stack")
                        .titleSlug("min-stack")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_STACK)
                        .link("https://leetcode.com/problems/min-stack/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Daily Temperatures")
                        .titleSlug("daily-temperatures")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_STACK)
                        .link("https://leetcode.com/problems/daily-temperatures/")
                        .build()
        ));

        // 8. Heap / Priority Queue
        registerTopic(List.of("Heap (Priority Queue)", TOPIC_HEAP, "Priority Queue"), List.of(
                CuratedProblemDTO.builder()
                        .title("Kth Largest Element in an Array")
                        .titleSlug("kth-largest-element-in-an-array")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_HEAP)
                        .link("https://leetcode.com/problems/kth-largest-element-in-an-array/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Top K Frequent Elements")
                        .titleSlug("top-k-frequent-elements")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_HEAP)
                        .link("https://leetcode.com/problems/top-k-frequent-elements/")
                        .build()
        ));

        // 9. Backtracking
        registerTopic(List.of(TOPIC_BACKTRACKING), List.of(
                CuratedProblemDTO.builder()
                        .title("Subsets")
                        .titleSlug("subsets")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_BACKTRACKING)
                        .link("https://leetcode.com/problems/subsets/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Permutations")
                        .titleSlug("permutations")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_BACKTRACKING)
                        .link("https://leetcode.com/problems/permutations/")
                        .build()
        ));

        // 10. Linked List
        registerTopic(List.of(TOPIC_LINKED_LIST), List.of(
                CuratedProblemDTO.builder()
                        .title("Reverse Linked List")
                        .titleSlug("reverse-linked-list")
                        .difficulty(DIFF_EASY)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_LINKED_LIST)
                        .link("https://leetcode.com/problems/reverse-linked-list/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Linked List Cycle")
                        .titleSlug("linked-list-cycle")
                        .difficulty(DIFF_EASY)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_LINKED_LIST)
                        .link("https://leetcode.com/problems/linked-list-cycle/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Merge Two Sorted Lists")
                        .titleSlug("merge-two-sorted-lists")
                        .difficulty(DIFF_EASY)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_LINKED_LIST)
                        .link("https://leetcode.com/problems/merge-two-sorted-lists/")
                        .build()
        ));

        // 11. Hash Table
        registerTopic(List.of(TOPIC_HASH_TABLE, "Hash"), List.of(
                CuratedProblemDTO.builder()
                        .title("Two Sum")
                        .titleSlug("two-sum")
                        .difficulty(DIFF_EASY)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_HASH_TABLE)
                        .link("https://leetcode.com/problems/two-sum/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Group Anagrams")
                        .titleSlug("group-anagrams")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_HASH_TABLE)
                        .link("https://leetcode.com/problems/group-anagrams/")
                        .build()
        ));

        // 12. Greedy
        registerTopic(List.of(TOPIC_GREEDY), List.of(
                CuratedProblemDTO.builder()
                        .title("Jump Game")
                        .titleSlug("jump-game")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_GREEDY)
                        .link("https://leetcode.com/problems/jump-game/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Gas Station")
                        .titleSlug("gas-station")
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(TOPIC_GREEDY)
                        .link("https://leetcode.com/problems/gas-station/")
                        .build()
        ));
    }

    private static void registerTopic(List<String> aliases, List<CuratedProblemDTO> problems) {
        for (String alias : aliases) {
            TOPIC_CATALOG.put(alias.toLowerCase(), problems);
        }
    }

    public List<CuratedProblemDTO> getCuratedProblemsForTopic(String topicName) {
        if (topicName == null || topicName.isBlank()) {
            return Collections.emptyList();
        }
        String clean = topicName.trim().toLowerCase();
        for (Map.Entry<String, List<CuratedProblemDTO>> entry : TOPIC_CATALOG.entrySet()) {
            if (clean.contains(entry.getKey()) || entry.getKey().contains(clean)) {
                return entry.getValue();
            }
        }
        // Generic fallback with search link
        String slug = clean.replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
        return List.of(
                CuratedProblemDTO.builder()
                        .title("Explore " + topicName + " Problems")
                        .titleSlug(slug)
                        .difficulty(DIFF_MEDIUM)
                        .platform(PLATFORM_LEETCODE)
                        .topic(topicName)
                        .link("https://leetcode.com/problemset/all/?topicSlugs=" + slug)
                        .build()
        );
    }

    public boolean isCoreInterviewTopic(String topicName) {
        if (topicName == null || topicName.isBlank()) return false;
        String lower = topicName.toLowerCase();
        return TOPIC_CATALOG.keySet().stream().anyMatch(core -> lower.contains(core) || core.contains(lower));
    }

    public List<CuratedProblemDTO> getAllCuratedProblems() {
        Set<String> seenSlugs = new HashSet<>();
        List<CuratedProblemDTO> result = new ArrayList<>();
        for (List<CuratedProblemDTO> list : TOPIC_CATALOG.values()) {
            for (CuratedProblemDTO p : list) {
                if (p.getTitleSlug() != null && seenSlugs.add(p.getTitleSlug())) {
                    result.add(p);
                }
            }
        }
        return result;
    }

    public CuratedProblemDTO getRandomOrTopicProblem(String topic, String difficulty) {
        List<CuratedProblemDTO> pool = new ArrayList<>();
        if (topic != null && !topic.isBlank() && !"Any".equalsIgnoreCase(topic) && !"All".equalsIgnoreCase(topic)) {
            pool.addAll(getCuratedProblemsForTopic(topic));
        } else {
            pool.addAll(getAllCuratedProblems());
        }

        if (difficulty != null && !difficulty.isBlank() && !"Any".equalsIgnoreCase(difficulty)) {
            List<CuratedProblemDTO> filtered = pool.stream()
                    .filter(p -> difficulty.equalsIgnoreCase(p.getDifficulty()))
                    .toList();
            if (!filtered.isEmpty()) {
                pool = filtered;
            }
        }

        if (pool.isEmpty()) {
            return CuratedProblemDTO.builder()
                    .title("Two Sum")
                    .titleSlug("two-sum")
                    .difficulty(DIFF_EASY)
                    .platform(PLATFORM_LEETCODE)
                    .topic("Array")
                    .link("https://leetcode.com/problems/two-sum/")
                    .build();
        }

        List<CuratedProblemDTO> shuffled = new ArrayList<>(pool);
        Collections.shuffle(shuffled);
        return shuffled.get(0);
    }
}
