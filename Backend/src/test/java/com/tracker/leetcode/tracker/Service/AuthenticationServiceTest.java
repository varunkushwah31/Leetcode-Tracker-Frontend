package com.tracker.leetcode.tracker.Service;

import com.tracker.leetcode.tracker.DTO.AuthenticationResponse;
import com.tracker.leetcode.tracker.DTO.StudentRegisterRequest;
import com.tracker.leetcode.tracker.Exception.DuplicateStudentException;
import com.tracker.leetcode.tracker.Models.AuthProvider;
import com.tracker.leetcode.tracker.Models.Role;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import com.tracker.leetcode.tracker.Security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private MentorRepository mentorRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private StudentService studentService;

    @InjectMocks
    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        lenient().when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        lenient().when(jwtService.generateToken(any())).thenReturn("mock-jwt-token");

        com.tracker.leetcode.tracker.Models.RefreshToken mockToken = new com.tracker.leetcode.tracker.Models.RefreshToken();
        mockToken.setToken("mock-refresh-token");
        lenient().when(refreshTokenService.createRefreshToken(any())).thenReturn(mockToken);
    }

    @Test
    void registerStudent_WithLeetCodeOnly_ShouldSucceed() {
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Alice", "alice@example.com", "pass123", "alice_lc", null
        );

        when(studentRepository.findByEmail("alice@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("alice@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByLeetcodeUsername("alice_lc")).thenReturn(Optional.empty());
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> {
            Student s = inv.getArgument(0);
            s.setId("s1");
            return s;
        });

        AuthenticationResponse response = authenticationService.registerStudent(req);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.accessToken());
        assertEquals(Role.STUDENT, response.role());
        verify(studentRepository).save(argThat(s ->
                "alice_lc".equals(s.getLeetcodeUsername()) && s.getCodeforcesHandle() == null
        ));
    }

    @Test
    void registerStudent_WithCodeforcesOnly_ShouldSucceed() {
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Bob", "bob@example.com", "pass123", null, "tourist"
        );

        when(studentRepository.findByEmail("bob@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("bob@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByCodeforcesHandle("tourist")).thenReturn(Optional.empty());
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> {
            Student s = inv.getArgument(0);
            s.setId("s2");
            return s;
        });

        AuthenticationResponse response = authenticationService.registerStudent(req);

        assertNotNull(response);
        assertEquals("mock-jwt-token", response.accessToken());
        assertEquals(Role.STUDENT, response.role());
        verify(studentRepository).save(argThat(s ->
                s.getLeetcodeUsername() == null && "tourist".equals(s.getCodeforcesHandle())
        ));
    }

    @Test
    void registerStudent_WithBothPlatforms_ShouldSucceed() {
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Charlie", "charlie@example.com", "pass123", "charlie_lc", "charlie_cf"
        );

        when(studentRepository.findByEmail("charlie@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("charlie@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByLeetcodeUsername("charlie_lc")).thenReturn(Optional.empty());
        when(studentRepository.findByCodeforcesHandle("charlie_cf")).thenReturn(Optional.empty());
        when(studentRepository.save(any(Student.class))).thenAnswer(inv -> {
            Student s = inv.getArgument(0);
            s.setId("s3");
            return s;
        });

        AuthenticationResponse response = authenticationService.registerStudent(req);

        assertNotNull(response);
        verify(studentRepository).save(argThat(s ->
                "charlie_lc".equals(s.getLeetcodeUsername()) && "charlie_cf".equals(s.getCodeforcesHandle())
        ));
    }

    @Test
    void registerStudent_WithNeitherPlatform_ShouldThrowIllegalArgumentException() {
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Dave", "dave@example.com", "pass123", "   ", ""
        );

        when(studentRepository.findByEmail("dave@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("dave@example.com")).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> authenticationService.registerStudent(req)
        );

        assertTrue(ex.getMessage().contains("at least one platform username"));
        verify(studentRepository, never()).save(any());
    }

    @Test
    void registerStudent_WithDuplicateLeetcode_ShouldThrowDuplicateStudentException() {
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Eve", "eve@example.com", "pass123", "existing_lc", null
        );

        when(studentRepository.findByEmail("eve@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("eve@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByLeetcodeUsername("existing_lc")).thenReturn(Optional.of(new Student()));

        DuplicateStudentException ex = assertThrows(
                DuplicateStudentException.class,
                () -> authenticationService.registerStudent(req)
        );

        assertTrue(ex.getMessage().contains("already in use"));
        verify(studentRepository, never()).save(any());
    }

    @Test
    void registerStudent_WithDuplicateCodeforces_ShouldThrowDuplicateStudentException() {
        StudentRegisterRequest req = new StudentRegisterRequest(
                "Frank", "frank@example.com", "pass123", null, "existing_cf"
        );

        when(studentRepository.findByEmail("frank@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("frank@example.com")).thenReturn(Optional.empty());
        when(studentRepository.findByCodeforcesHandle("existing_cf")).thenReturn(Optional.of(new Student()));

        DuplicateStudentException ex = assertThrows(
                DuplicateStudentException.class,
                () -> authenticationService.registerStudent(req)
        );

        assertTrue(ex.getMessage().contains("already in use"));
        verify(studentRepository, never()).save(any());
    }
}
