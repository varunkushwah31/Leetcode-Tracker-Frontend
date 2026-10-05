package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.CuratedProblemDTO;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class CuratedTopicCatalog {

    private static final Map<String, List<CuratedProblemDTO>> TOPIC_CATALOG = new HashMap<>();

    static {
        // 1. Dynamic Programming
        registerTopic(List.of("Dynamic Programming", "dp"), List.of(
                CuratedProblemDTO.builder()
                        .title("Climbing Stairs")
                        .titleSlug("climbing-stairs")
                        .difficulty("Easy")
                        .platform("LEETCODE")
                        .topic("Dynamic Programming")
                        .link("https://leetcode.com/problems/climbing-stairs/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Coin Change")
                        .titleSlug("coin-change")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Dynamic Programming")
                        .link("https://leetcode.com/problems/coin-change/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Longest Increasing Subsequence")
                        .titleSlug("longest-increasing-subsequence")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Dynamic Programming")
                        .link("https://leetcode.com/problems/longest-increasing-subsequence/")
                        .build()
        ));

        // 2. Tree / Binary Tree
        registerTopic(List.of("Tree", "Binary Tree", "Binary Search Tree"), List.of(
                CuratedProblemDTO.builder()
                        .title("Maximum Depth of Binary Tree")
                        .titleSlug("maximum-depth-of-binary-tree")
                        .difficulty("Easy")
                        .platform("LEETCODE")
                        .topic("Tree")
                        .link("https://leetcode.com/problems/maximum-depth-of-binary-tree/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Binary Tree Level Order Traversal")
                        .titleSlug("binary-tree-level-order-traversal")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Tree")
                        .link("https://leetcode.com/problems/binary-tree-level-order-traversal/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Lowest Common Ancestor of a Binary Tree")
                        .titleSlug("lowest-common-ancestor-of-a-binary-tree")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Tree")
                        .link("https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/")
                        .build()
        ));

        // 3. Graph
        registerTopic(List.of("Graph", "Breadth-First Search", "Depth-First Search", "dfs", "bfs"), List.of(
                CuratedProblemDTO.builder()
                        .title("Number of Islands")
                        .titleSlug("number-of-islands")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Graph")
                        .link("https://leetcode.com/problems/number-of-islands/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Clone Graph")
                        .titleSlug("clone-graph")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Graph")
                        .link("https://leetcode.com/problems/clone-graph/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Course Schedule")
                        .titleSlug("course-schedule")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Graph")
                        .link("https://leetcode.com/problems/course-schedule/")
                        .build()
        ));

        // 4. Binary Search
        registerTopic(List.of("Binary Search"), List.of(
                CuratedProblemDTO.builder()
                        .title("Binary Search")
                        .titleSlug("binary-search")
                        .difficulty("Easy")
                        .platform("LEETCODE")
                        .topic("Binary Search")
                        .link("https://leetcode.com/problems/binary-search/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Search in Rotated Sorted Array")
                        .titleSlug("search-in-rotated-sorted-array")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Binary Search")
                        .link("https://leetcode.com/problems/search-in-rotated-sorted-array/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Koko Eating Bananas")
                        .titleSlug("koko-eating-bananas")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Binary Search")
                        .link("https://leetcode.com/problems/koko-eating-bananas/")
                        .build()
        ));

        // 5. Two Pointers
        registerTopic(List.of("Two Pointers", "two pointers"), List.of(
                CuratedProblemDTO.builder()
                        .title("Valid Palindrome")
                        .titleSlug("valid-palindrome")
                        .difficulty("Easy")
                        .platform("LEETCODE")
                        .topic("Two Pointers")
                        .link("https://leetcode.com/problems/valid-palindrome/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Two Sum II - Input Array Is Sorted")
                        .titleSlug("two-sum-ii-input-array-is-sorted")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Two Pointers")
                        .link("https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Container With Most Water")
                        .titleSlug("container-with-most-water")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Two Pointers")
                        .link("https://leetcode.com/problems/container-with-most-water/")
                        .build()
        ));

        // 6. Sliding Window
        registerTopic(List.of("Sliding Window"), List.of(
                CuratedProblemDTO.builder()
                        .title("Best Time to Buy and Sell Stock")
                        .titleSlug("best-time-to-buy-and-sell-stock")
                        .difficulty("Easy")
                        .platform("LEETCODE")
                        .topic("Sliding Window")
                        .link("https://leetcode.com/problems/best-time-to-buy-and-sell-stock/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Longest Substring Without Repeating Characters")
                        .titleSlug("longest-substring-without-repeating-characters")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Sliding Window")
                        .link("https://leetcode.com/problems/longest-substring-without-repeating-characters/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Minimum Window Substring")
                        .titleSlug("minimum-window-substring")
                        .difficulty("Hard")
                        .platform("LEETCODE")
                        .topic("Sliding Window")
                        .link("https://leetcode.com/problems/minimum-window-substring/")
                        .build()
        ));

        // 7. Stack & Queue
        registerTopic(List.of("Stack", "Monotonic Stack", "Queue", "Monotonic Queue"), List.of(
                CuratedProblemDTO.builder()
                        .title("Valid Parentheses")
                        .titleSlug("valid-parentheses")
                        .difficulty("Easy")
                        .platform("LEETCODE")
                        .topic("Stack")
                        .link("https://leetcode.com/problems/valid-parentheses/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Min Stack")
                        .titleSlug("min-stack")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Stack")
                        .link("https://leetcode.com/problems/min-stack/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Daily Temperatures")
                        .titleSlug("daily-temperatures")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Stack")
                        .link("https://leetcode.com/problems/daily-temperatures/")
                        .build()
        ));

        // 8. Heap / Priority Queue
        registerTopic(List.of("Heap (Priority Queue)", "Heap", "Priority Queue"), List.of(
                CuratedProblemDTO.builder()
                        .title("Kth Largest Element in an Array")
                        .titleSlug("kth-largest-element-in-an-array")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Heap")
                        .link("https://leetcode.com/problems/kth-largest-element-in-an-array/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Top K Frequent Elements")
                        .titleSlug("top-k-frequent-elements")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Heap")
                        .link("https://leetcode.com/problems/top-k-frequent-elements/")
                        .build()
        ));

        // 9. Backtracking
        registerTopic(List.of("Backtracking"), List.of(
                CuratedProblemDTO.builder()
                        .title("Subsets")
                        .titleSlug("subsets")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Backtracking")
                        .link("https://leetcode.com/problems/subsets/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Permutations")
                        .titleSlug("permutations")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Backtracking")
                        .link("https://leetcode.com/problems/permutations/")
                        .build()
        ));

        // 10. Linked List
        registerTopic(List.of("Linked List"), List.of(
                CuratedProblemDTO.builder()
                        .title("Reverse Linked List")
                        .titleSlug("reverse-linked-list")
                        .difficulty("Easy")
                        .platform("LEETCODE")
                        .topic("Linked List")
                        .link("https://leetcode.com/problems/reverse-linked-list/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Linked List Cycle")
                        .titleSlug("linked-list-cycle")
                        .difficulty("Easy")
                        .platform("LEETCODE")
                        .topic("Linked List")
                        .link("https://leetcode.com/problems/linked-list-cycle/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Merge Two Sorted Lists")
                        .titleSlug("merge-two-sorted-lists")
                        .difficulty("Easy")
                        .platform("LEETCODE")
                        .topic("Linked List")
                        .link("https://leetcode.com/problems/merge-two-sorted-lists/")
                        .build()
        ));

        // 11. Hash Table
        registerTopic(List.of("Hash Table", "Hash"), List.of(
                CuratedProblemDTO.builder()
                        .title("Two Sum")
                        .titleSlug("two-sum")
                        .difficulty("Easy")
                        .platform("LEETCODE")
                        .topic("Hash Table")
                        .link("https://leetcode.com/problems/two-sum/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Group Anagrams")
                        .titleSlug("group-anagrams")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Hash Table")
                        .link("https://leetcode.com/problems/group-anagrams/")
                        .build()
        ));

        // 12. Greedy
        registerTopic(List.of("Greedy"), List.of(
                CuratedProblemDTO.builder()
                        .title("Jump Game")
                        .titleSlug("jump-game")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Greedy")
                        .link("https://leetcode.com/problems/jump-game/")
                        .build(),
                CuratedProblemDTO.builder()
                        .title("Gas Station")
                        .titleSlug("gas-station")
                        .difficulty("Medium")
                        .platform("LEETCODE")
                        .topic("Greedy")
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
                        .difficulty("Medium")
                        .platform("LEETCODE")
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
}
