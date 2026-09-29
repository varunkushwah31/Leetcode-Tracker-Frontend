package com.tracker.leetcode.tracker.Config;

import com.tracker.leetcode.tracker.Models.AuthProvider;
import com.tracker.leetcode.tracker.Models.Mentor;
import com.tracker.leetcode.tracker.Models.Role;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private final MentorRepository mentorRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Check if the bootstrap admin already exists (indexed exists query, no full scan)
        boolean adminExists = mentorRepository.existsByEmail("admin@mentorsync.com");

        // 2. If no admin exists, create the master key account
        if (!adminExists) {
            log.info("No SUPER_ADMIN found in database. Bootstrapping default master account...");

            Mentor defaultAdmin = Mentor.builder()
                    .name("Master Admin")
                    .email("admin@mentorsync.com")
                    .password(passwordEncoder.encode("Admin123!"))
                    .role(Role.SUPER_ADMIN)
                    .enabled(true) // <-- Explicitly enable it
                    .provider(AuthProvider.LOCAL) // <-- Explicitly set provider
                    .classroomIds(new ArrayList<>()) // <-- Prevent NullPointerExceptions
                    .build();

            //
            mentorRepository.save(defaultAdmin);
            log.info("Default SUPER_ADMIN created successfully for email: admin@mentorsync.com");
        } else {
            log.info("SUPER_ADMIN account already exists. Skipping bootstrap process.");
        }
    }
}