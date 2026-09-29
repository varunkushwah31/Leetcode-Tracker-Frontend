package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.AuthenticationRequest;
import com.tracker.leetcode.tracker.DTO.AuthenticationResponse;
import com.tracker.leetcode.tracker.DTO.RegisterRequest;
import com.tracker.leetcode.tracker.DTO.StudentRegisterRequest;
import com.tracker.leetcode.tracker.Exception.DuplicateMentorException;
import com.tracker.leetcode.tracker.Exception.DuplicateStudentException;
import com.tracker.leetcode.tracker.Exception.UserAuthenticationException;
import com.tracker.leetcode.tracker.Models.*;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import com.tracker.leetcode.tracker.Security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthenticationService {

    private final StudentRepository studentRepository;
    private final MentorRepository mentorRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final StudentService studentService;

    // 1. REGISTRATION LOGIC

    public AuthenticationResponse register(RegisterRequest request){
        log.info("Registering new Mentor with email: {}", request.email());
        if (mentorRepository.findByEmail(request.email()).isPresent() || studentRepository.findByEmail(request.email()).isPresent()){
            throw new DuplicateMentorException("Email already in use.");
        }
        Mentor mentor = new Mentor();
        mentor.setName(request.name());
        mentor.setEmail(request.email());
        mentor.setPassword(passwordEncoder.encode(request.password()));
        mentor.setRole(Role.MENTOR);
        mentor.setProvider(AuthProvider.LOCAL);
        mentor.setEnabled(true);

        Mentor savedMentor = mentorRepository.save(mentor);
        return generateAuthResponseForMentor(savedMentor);
    }

    public AuthenticationResponse registerStudent(StudentRegisterRequest request){
        log.info("Registering new student: {}", request.email());
        if (studentRepository.findByEmail(request.email()).isPresent() || mentorRepository.findByEmail(request.email()).isPresent()){
            throw new DuplicateStudentException("Student email already in use.");
        }
        if (studentRepository.findByLeetcodeUsername(request.leetcodeUsername()).isPresent()){
            throw new DuplicateStudentException("LeetCode username '" + request.leetcodeUsername() + "' already in use.");
        }
        Student student = new Student();
        student.setName(request.name());
        student.setEmail(request.email());
        student.setPassword(passwordEncoder.encode(request.password()));
        student.setLeetcodeUsername(request.leetcodeUsername());
        student.setRole(Role.STUDENT);
        student.setAuthProvider(AuthProvider.LOCAL);
        student.setEnabled(true);

        Student savedStudent = studentRepository.save(student);

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                log.info("Auto-syncing LeetCode data in background for new student: {}", savedStudent.getLeetcodeUsername());
                studentService.syncAllProfileData(savedStudent.getLeetcodeUsername());
            } catch (Exception e) {
                log.warn("Failed to auto-sync LeetCode data for {}. Error: {}", savedStudent.getLeetcodeUsername(), e.getMessage());
            }
        });

        return generateAuthResponseForStudent(savedStudent);
    }

    // 2. LOGIN LOGIC

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        // 1. Check passwords via Spring Security
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.email(),
                            request.password()
                    )
            );
        } catch (Exception e) {
            log.error("Authentication failed for user: {}", request.email());
            throw new UserAuthenticationException("Invalid email or password");
        }

        // 2. Are they a Student?
        var studentOpt = studentRepository.findByEmail(request.email());
        if (studentOpt.isPresent()) {
            return generateAuthResponseForStudent(studentOpt.get());
        }

        // 3. Are they a Mentor?
        var mentorOpt = mentorRepository.findByEmail(request.email());
        if (mentorOpt.isPresent()) {
            return generateAuthResponseForMentor(mentorOpt.get());
        }

        throw new UserAuthenticationException("User not found after successful authentication");
    }

    // 3. REFRESH TOKEN LOGIC

    public AuthenticationResponse refreshToken(String requestRefreshToken){
        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getMentorId) // Fetches the generic User ID attached to the token
                .map(userId -> {

                    // Is this ID a Student?
                    var studentOpt = studentRepository.findById(userId);
                    if (studentOpt.isPresent()) {
                        Student student = studentOpt.get();
                        String jwtToken = jwtService.generateToken(student);
                        return AuthenticationResponse.builder()
                                .accessToken(jwtToken)
                                .refreshToken(requestRefreshToken)
                                .userId(student.getId())
                                .mentorId(student.getId())
                                .name(student.getName())
                                .role(student.getRole())
                                .build();
                    }

                    // Is this ID a Mentor?
                    var mentorOpt = mentorRepository.findById(userId);
                    if (mentorOpt.isPresent()) {
                        Mentor mentor = mentorOpt.get();
                        String jwtToken = jwtService.generateToken(mentor);
                        return AuthenticationResponse.builder()
                                .accessToken(jwtToken)
                                .refreshToken(requestRefreshToken)
                                .userId(mentor.getId())
                                .mentorId(mentor.getId())
                                .name(mentor.getName())
                                .role(mentor.getRole())
                                .build();
                    }

                    throw new UserAuthenticationException("User not found during refresh");
                })
                .orElseThrow(() -> new UserAuthenticationException("Refresh token is not in database!"));
    }

    // 4. DRY HELPER METHODS

    private AuthenticationResponse generateAuthResponseForStudent(Student student) {
        String jwtToken = jwtService.generateToken(student);

        refreshTokenService.deleteByMentorId(student.getId());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(student.getId());

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken.getToken())
                .userId(student.getId())
                .mentorId(student.getId())
                .name(student.getName())
                .role(student.getRole())
                .build();
    }

    private AuthenticationResponse generateAuthResponseForMentor(Mentor mentor) {
        String jwtToken = jwtService.generateToken(mentor);

        refreshTokenService.deleteByMentorId(mentor.getId());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(mentor.getId());

        return AuthenticationResponse.builder()
                .accessToken(jwtToken)
                .refreshToken(refreshToken.getToken())
                .userId(mentor.getId())
                .mentorId(mentor.getId())
                .name(mentor.getName())
                .role(mentor.getRole())
                .build();
    }
}