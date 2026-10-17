package com.tracker.leetcode.tracker.Security;

import com.tracker.leetcode.tracker.Models.AuthProvider;
import com.tracker.leetcode.tracker.Models.Mentor;
import com.tracker.leetcode.tracker.Models.RefreshToken;
import com.tracker.leetcode.tracker.Models.Role;
import com.tracker.leetcode.tracker.Models.Student;
import com.tracker.leetcode.tracker.Repository.MentorRepository;
import com.tracker.leetcode.tracker.Repository.StudentRepository;
import com.tracker.leetcode.tracker.Service.RefreshTokenService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OAuth2LoginSuccessHandlerTest {

    @Mock
    private MentorRepository mentorRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private OAuth2User oAuth2User;

    @Mock
    private OAuth2AuthenticationToken authentication;

    @InjectMocks
    private OAuth2LoginSuccessHandler successHandler;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(successHandler, "frontendRedirectUri", "http://localhost:5173/oauth2/redirect");
        ReflectionTestUtils.setField(successHandler, "cookieSecure", false);
        ReflectionTestUtils.setField(successHandler, "cookieSameSite", "Lax");
        lenient().when(response.encodeRedirectURL(anyString())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void onAuthenticationSuccess_ShouldLoginExistingStudent() throws Exception {
        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        when(authentication.getAuthorizedClientRegistrationId()).thenReturn("google");
        when(oAuth2User.getAttribute("email")).thenReturn("student@example.com");
        when(oAuth2User.getAttribute("name")).thenReturn("Existing Student");
        when(oAuth2User.getAttribute("picture")).thenReturn("https://avatar.google.com/pic.jpg");

        Student existingStudent = new Student();
        existingStudent.setId("student-123");
        existingStudent.setName("Existing Student");
        existingStudent.setEmail("student@example.com");
        existingStudent.setRole(Role.STUDENT);
        existingStudent.setEnabled(true);

        when(studentRepository.findByEmail("student@example.com")).thenReturn(Optional.of(existingStudent));
        when(mentorRepository.findByEmail("student@example.com")).thenReturn(Optional.empty());
        when(jwtService.generateToken(any())).thenReturn("mock-jwt-token");
        when(refreshTokenService.createRefreshToken(anyString()))
                .thenReturn(RefreshToken.builder().token("mock-refresh-token").build());

        successHandler.onAuthenticationSuccess(request, response, authentication);

        verify(studentRepository).save(existingStudent);
        assertThat(existingStudent.getAuthProvider()).isEqualTo(AuthProvider.GOOGLE);
        assertThat(existingStudent.getAvatarUrl()).isEqualTo("https://avatar.google.com/pic.jpg");

        ArgumentCaptor<String> redirectCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).sendRedirect(redirectCaptor.capture());
        String redirectUrl = redirectCaptor.getValue();

        assertThat(redirectUrl)
                .contains("http://localhost:5173/oauth2/redirect")
                .contains("token=mock-jwt-token")
                .contains("userId=student-123")
                .contains("role=STUDENT");
    }

    @Test
    void onAuthenticationSuccess_ShouldLoginExistingMentor() throws Exception {
        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        when(authentication.getAuthorizedClientRegistrationId()).thenReturn("google");
        when(oAuth2User.getAttribute("email")).thenReturn("mentor@example.com");
        when(oAuth2User.getAttribute("name")).thenReturn("Existing Mentor");

        Mentor existingMentor = Mentor.builder()
                .id("mentor-456")
                .name("Existing Mentor")
                .email("mentor@example.com")
                .role(Role.MENTOR)
                .enabled(true)
                .build();

        when(studentRepository.findByEmail("mentor@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("mentor@example.com")).thenReturn(Optional.of(existingMentor));
        when(jwtService.generateToken(any())).thenReturn("mock-jwt-mentor");
        when(refreshTokenService.createRefreshToken("mentor-456"))
                .thenReturn(RefreshToken.builder().token("mock-refresh-mentor").build());

        successHandler.onAuthenticationSuccess(request, response, authentication);

        verify(mentorRepository).save(existingMentor);
        assertThat(existingMentor.getProvider()).isEqualTo(AuthProvider.GOOGLE);

        ArgumentCaptor<String> redirectCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).sendRedirect(redirectCaptor.capture());
        String redirectUrl = redirectCaptor.getValue();

        assertThat(redirectUrl)
                .contains("token=mock-jwt-mentor")
                .contains("userId=mentor-456")
                .contains("role=MENTOR");
    }

    @Test
    void onAuthenticationSuccess_ShouldAutoRegisterNewStudent() throws Exception {
        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        when(authentication.getAuthorizedClientRegistrationId()).thenReturn("google");
        when(oAuth2User.getAttribute("email")).thenReturn("newbie@example.com");
        when(oAuth2User.getAttribute("name")).thenReturn("New User");
        when(oAuth2User.getAttribute("picture")).thenReturn("https://pic.com/avatar.jpg");

        when(studentRepository.findByEmail("newbie@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("newbie@example.com")).thenReturn(Optional.empty());

        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> {
            Student s = invocation.getArgument(0);
            s.setId("new-student-999");
            return s;
        });

        when(jwtService.generateToken(any())).thenReturn("mock-new-token");
        when(refreshTokenService.createRefreshToken("new-student-999"))
                .thenReturn(RefreshToken.builder().token("mock-new-refresh").build());

        successHandler.onAuthenticationSuccess(request, response, authentication);

        ArgumentCaptor<Student> studentCaptor = ArgumentCaptor.forClass(Student.class);
        verify(studentRepository).save(studentCaptor.capture());
        Student saved = studentCaptor.getValue();

        assertThat(saved.getEmail()).isEqualTo("newbie@example.com");
        assertThat(saved.getName()).isEqualTo("New User");
        assertThat(saved.getRole()).isEqualTo(Role.STUDENT);
        assertThat(saved.getAuthProvider()).isEqualTo(AuthProvider.GOOGLE);

        ArgumentCaptor<String> redirectCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).sendRedirect(redirectCaptor.capture());
        String redirectUrl = redirectCaptor.getValue();

        assertThat(redirectUrl)
                .contains("token=mock-new-token")
                .contains("userId=new-student-999")
                .contains("role=STUDENT");
    }

    @Test
    void onAuthenticationSuccess_ShouldHandleGitHubAttributes() throws Exception {
        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        when(authentication.getAuthorizedClientRegistrationId()).thenReturn("github");
        when(oAuth2User.getAttribute("email")).thenReturn("githuber@example.com");
        when(oAuth2User.getAttribute("name")).thenReturn(null);
        when(oAuth2User.getAttribute("login")).thenReturn("octocat");
        when(oAuth2User.getAttribute("picture")).thenReturn(null);
        when(oAuth2User.getAttribute("avatar_url")).thenReturn("https://github.com/avatar.png");

        when(studentRepository.findByEmail("githuber@example.com")).thenReturn(Optional.empty());
        when(mentorRepository.findByEmail("githuber@example.com")).thenReturn(Optional.empty());

        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> {
            Student s = invocation.getArgument(0);
            s.setId("octocat-id");
            return s;
        });

        when(jwtService.generateToken(any())).thenReturn("octo-token");
        when(refreshTokenService.createRefreshToken("octocat-id"))
                .thenReturn(RefreshToken.builder().token("octo-refresh").build());

        successHandler.onAuthenticationSuccess(request, response, authentication);

        ArgumentCaptor<Student> studentCaptor = ArgumentCaptor.forClass(Student.class);
        verify(studentRepository).save(studentCaptor.capture());
        Student saved = studentCaptor.getValue();

        assertThat(saved.getName()).isEqualTo("octocat");
        assertThat(saved.getAvatarUrl()).isEqualTo("https://github.com/avatar.png");
        assertThat(saved.getAuthProvider()).isEqualTo(AuthProvider.GITHUB);
        assertThat(saved.getSocialMedia()).isNotNull();
        assertThat(saved.getSocialMedia().getGithub()).isEqualTo("octocat");
    }

    @Test
    void onAuthenticationSuccess_ShouldRedirectWithError_WhenEmailMissing() throws Exception {
        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        when(authentication.getAuthorizedClientRegistrationId()).thenReturn("github");
        when(oAuth2User.getAttribute("email")).thenReturn(null);

        successHandler.onAuthenticationSuccess(request, response, authentication);

        ArgumentCaptor<String> redirectCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).sendRedirect(redirectCaptor.capture());
        String redirectUrl = redirectCaptor.getValue();

        assertThat(redirectUrl).contains("error=");
        assertThat(redirectUrl).contains("Could not retrieve email");
    }

    @Test
    void onAuthenticationSuccess_ShouldRedirectWithError_WhenAccountDisabled() throws Exception {
        when(authentication.getPrincipal()).thenReturn(oAuth2User);
        when(authentication.getAuthorizedClientRegistrationId()).thenReturn("google");
        when(oAuth2User.getAttribute("email")).thenReturn("disabled@example.com");

        Student disabledStudent = new Student();
        disabledStudent.setEmail("disabled@example.com");
        disabledStudent.setEnabled(false);

        when(studentRepository.findByEmail("disabled@example.com")).thenReturn(Optional.of(disabledStudent));

        successHandler.onAuthenticationSuccess(request, response, authentication);

        ArgumentCaptor<String> redirectCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).sendRedirect(redirectCaptor.capture());
        String redirectUrl = redirectCaptor.getValue();

        assertThat(redirectUrl).contains("error=");
        assertThat(redirectUrl).contains("account has been disabled");
    }
}
