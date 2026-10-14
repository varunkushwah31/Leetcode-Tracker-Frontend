package com.tracker.leetcode.tracker.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tracker.leetcode.tracker.Exception.ValidationFailedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;

@Slf4j
@Service
public class ResendEmailService {

    private final String resendApiKey;
    private final String resendFromEmail;
    private final String mailUsername;
    private final String emailJsServiceId;
    private final String emailJsTemplateId;
    private final String emailJsPublicKey;
    private final String emailJsPrivateKey;
    private final JavaMailSender mailSender;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Autowired
    public ResendEmailService(
            @Value("${resend.api-key:}") String resendApiKey,
            @Value("${resend.from-email:onboarding@resend.dev}") String resendFromEmail,
            @Value("${spring.mail.username:}") String mailUsername,
            @Value("${emailjs.service-id:}") String emailJsServiceId,
            @Value("${emailjs.template-id:}") String emailJsTemplateId,
            @Value("${emailjs.public-key:}") String emailJsPublicKey,
            @Value("${emailjs.private-key:}") String emailJsPrivateKey,
            @org.springframework.beans.factory.annotation.Autowired(required = false) JavaMailSender mailSender
    ) {
        this.resendApiKey = resendApiKey != null ? resendApiKey.trim() : "";
        this.resendFromEmail = (resendFromEmail != null && !resendFromEmail.isBlank())
                ? resendFromEmail.trim()
                : "onboarding@resend.dev";
        this.mailUsername = mailUsername != null ? mailUsername.trim() : "";
        this.emailJsServiceId = emailJsServiceId != null ? emailJsServiceId.trim() : "";
        this.emailJsTemplateId = emailJsTemplateId != null ? emailJsTemplateId.trim() : "";
        this.emailJsPublicKey = emailJsPublicKey != null ? emailJsPublicKey.trim() : "";
        this.emailJsPrivateKey = emailJsPrivateKey != null ? emailJsPrivateKey.trim() : "";
        this.mailSender = mailSender;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public ResendEmailService(String resendApiKey, String resendFromEmail, String mailUsername, JavaMailSender mailSender) {
        this(resendApiKey, resendFromEmail, mailUsername, "", "", "", "", mailSender);
    }

    public boolean isEmailJsConfigured() {
        return !emailJsServiceId.isEmpty() && !emailJsTemplateId.isEmpty() && !emailJsPublicKey.isEmpty();
    }

    public boolean isConfigured() {
        return !resendApiKey.isEmpty();
    }

    public boolean isSmtpConfigured() {
        return mailSender != null && !mailUsername.isBlank();
    }

    /**
     * Sends a 6-digit password reset OTP email using EmailJS, Resend, or SMTP.
     *
     * @param toEmail   Recipient email address
     * @param otp       6-digit numeric OTP code
     * @param userName  Recipient display name (optional)
     */
    public void sendOtpEmail(String toEmail, String otp, String userName) {
        if (toEmail == null || toEmail.isBlank()) {
            throw new ValidationFailedException("Recipient email address is required.");
        }
        if (otp == null || otp.isBlank()) {
            throw new ValidationFailedException("OTP code is required.");
        }

        String greeting = (userName != null && !userName.isBlank()) ? " " + userName.trim() : "";
        String htmlContent = buildOtpHtmlTemplate(greeting, otp);
        String textContent = "Hello" + greeting + ",\n\nWe received a request to reset your password.\nYour verification code is: " + otp + "\n\nThis code is valid for 10 minutes.\n\nIf you did not request this, please disregard this email.";
        String subject = "MentorSync - Password Reset Code: " + otp;

        if (isEmailJsConfigured()) {
            sendViaEmailJs(toEmail, otp, userName, subject);
            return;
        }

        if (isConfigured()) {
            sendEmailInternal(toEmail, subject, htmlContent, textContent);
            return;
        }

        if (isSmtpConfigured()) {
            sendViaSmtp(toEmail, subject, htmlContent, textContent);
            return;
        }

        log.warn("\n=================================================================\n" +
                 " [DEV MODE] Neither EMAILJS, RESEND_API_KEY nor MAIL_USERNAME is configured.\n" +
                 " Type         : PASSWORD RESET OTP\n" +
                 " Target Email : {}\n" +
                 " OTP Code     : {}\n" +
                 " (In production, configure EmailJS, Resend, or Gmail SMTP to dispatch real emails)\n" +
                 "=================================================================", toEmail, otp);
    }

    /**
     * Sends a 6-digit email verification OTP for newly registering students.
     *
     * @param toEmail   Student email address
     * @param otp       6-digit numeric OTP code
     * @param userName  Student display name (optional)
     */
    public void sendStudentRegistrationOtp(String toEmail, String otp, String userName) {
        if (toEmail == null || toEmail.isBlank()) {
            throw new ValidationFailedException("Recipient email address is required.");
        }
        if (otp == null || otp.isBlank()) {
            throw new ValidationFailedException("OTP code is required.");
        }

        String greeting = (userName != null && !userName.isBlank()) ? " " + userName.trim() : "";
        String htmlContent = buildStudentRegistrationOtpHtmlTemplate(greeting, otp);
        String textContent = "Welcome to MentorSync" + greeting + "!\n\nPlease enter the 6-digit verification code below to verify your student email:\n\n" + otp + "\n\nThis code expires in 10 minutes.";
        String subject = "MentorSync - Verify Your Email: " + otp;

        if (isEmailJsConfigured()) {
            sendViaEmailJs(toEmail, otp, userName, subject);
            return;
        }

        if (isConfigured()) {
            sendEmailInternal(toEmail, subject, htmlContent, textContent);
            return;
        }

        if (isSmtpConfigured()) {
            sendViaSmtp(toEmail, subject, htmlContent, textContent);
            return;
        }

        log.warn("\n=================================================================\n" +
                 " [DEV MODE] Neither EMAILJS, RESEND_API_KEY nor MAIL_USERNAME is configured.\n" +
                 " Type         : STUDENT REGISTRATION EMAIL VERIFICATION\n" +
                 " Target Email : {}\n" +
                 " OTP Code     : {}\n" +
                 " (In production, configure EmailJS, Resend, or Gmail SMTP to dispatch real emails)\n" +
                 "=================================================================", toEmail, otp);
    }

    /**
     * Sends a mentor nudge email about a pending assignment via Resend or SMTP.
     */
    public void sendNudgeEmail(String toEmail, String studentName, String assignmentName, String className) {
        if (toEmail == null || toEmail.isBlank()) return;

        String greeting = (studentName != null && !studentName.isBlank()) ? " " + studentName.trim() : "";
        String htmlContent = buildNudgeHtmlTemplate(greeting, assignmentName, className);
        String textContent = "Hi" + greeting + ",\n\nThis is a gentle reminder that you have a pending assignment: '" + assignmentName + "' for " + className + ".\nPlease complete it on LeetCode and validate it on your MentorSync dashboard.";
        String subject = "Reminder: Pending LeetCode Assignment for " + className;

        if (isConfigured()) {
            sendEmailInternal(toEmail, subject, htmlContent, textContent);
            return;
        }

        if (isSmtpConfigured()) {
            sendViaSmtp(toEmail, subject, htmlContent, textContent);
        }
    }

    /**
     * Sends a test verification email to confirm the email provider (EmailJS, Resend, or SMTP)
     * is functioning properly in production.
     */
    public Map<String, Object> sendTestEmail(String toEmail) {
        if (toEmail == null || toEmail.isBlank()) {
            throw new ValidationFailedException("Recipient email address is required.");
        }
        String testOtp = "123456";
        String userName = "Test User";
        String subject = "MentorSync - Verification Test Code: " + testOtp;

        String provider;
        if (isEmailJsConfigured()) {
            sendViaEmailJs(toEmail, testOtp, userName, subject);
            provider = "EMAILJS";
        } else if (isConfigured()) {
            String htmlContent = buildOtpHtmlTemplate(" " + userName, testOtp);
            String textContent = "Hello " + userName + ",\n\nYour test verification code is: " + testOtp;
            sendEmailInternal(toEmail, subject, htmlContent, textContent);
            provider = "RESEND";
        } else if (isSmtpConfigured()) {
            String htmlContent = buildOtpHtmlTemplate(" " + userName, testOtp);
            String textContent = "Hello " + userName + ",\n\nYour test verification code is: " + testOtp;
            sendViaSmtp(toEmail, subject, htmlContent, textContent);
            provider = "SMTP";
        } else {
            provider = "DEV_CONSOLE";
            log.warn("\n=================================================================\n" +
                     " [DEV MODE] Test email dispatched.\n" +
                     " Provider     : NONE (Console Log Only)\n" +
                     " Target Email : {}\n" +
                     " OTP Code     : {}\n" +
                     "=================================================================", toEmail, testOtp);
        }

        return Map.of(
                "status", "SUCCESS",
                "message", "Test verification email dispatched successfully to " + toEmail.trim(),
                "provider", provider,
                "emailJsConfigured", isEmailJsConfigured(),
                "resendConfigured", isConfigured(),
                "smtpConfigured", isSmtpConfigured()
        );
    }

    private void sendViaEmailJs(String toEmail, String otp, String userName, String subject) {
        sendViaEmailJs(toEmail, otp, userName, subject, "");
    }

    private void sendViaEmailJs(String toEmail, String otp, String userName, String subject, String message) {
        Map<String, Object> templateParams = new java.util.HashMap<>();
        String safeName = (userName != null && !userName.isBlank()) ? userName.trim() : "Student";
        templateParams.put("to_email", toEmail.trim());
        templateParams.put("email", toEmail.trim());
        templateParams.put("to_name", safeName);
        templateParams.put("user_name", safeName);
        templateParams.put("name", safeName);
        templateParams.put("otp_code", otp != null ? otp : "");
        templateParams.put("otp", otp != null ? otp : "");
        templateParams.put("code", otp != null ? otp : "");
        templateParams.put("subject", subject);
        templateParams.put("message", message != null ? message : "");
        templateParams.put("expiry_minutes", "10");
        templateParams.put("app_name", "MentorSync");

        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("service_id", emailJsServiceId);
        payload.put("template_id", emailJsTemplateId);
        payload.put("user_id", emailJsPublicKey);
        if (!emailJsPrivateKey.isEmpty()) {
            payload.put("accessToken", emailJsPrivateKey);
        }
        payload.put("template_params", templateParams);

        try {
            String jsonBody = objectMapper.writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.emailjs.com/api/v1.0/email/send"))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", "MentorSync-Backend/1.0")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(15))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Successfully sent email to {} via EmailJS API.", toEmail);
            } else {
                log.error("EmailJS API failed for {} with status {}: {}", toEmail, response.statusCode(), response.body());
                throw new ValidationFailedException("Failed to dispatch verification email via EmailJS: " + response.body());
            }
        } catch (ValidationFailedException e) {
            throw e;
        } catch (Exception e) {
            log.error("Exception sending email via EmailJS to {}: {}", toEmail, e.getMessage(), e);
            throw new ValidationFailedException("Unable to send verification email. Please try again later.");
        }
    }

    private void sendViaSmtp(String toEmail, String subject, String htmlContent, String textContent) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String fromHeader = (!mailUsername.isBlank())
                    ? "MentorSync <" + mailUsername + ">"
                    : resendFromEmail;
            helper.setFrom(fromHeader);
            helper.setTo(toEmail.trim());
            helper.setSubject(subject);
            helper.setText(textContent, htmlContent);

            mailSender.send(mimeMessage);
            log.info("Successfully sent email to {} via SMTP (user: {}).", toEmail, mailUsername);
        } catch (Exception e) {
            log.error("Failed to send email to {} via SMTP: {}", toEmail, e.getMessage(), e);
            throw new ValidationFailedException("Unable to send email via SMTP. Please check your mail credentials.");
        }
    }

    private void sendEmailInternal(String toEmail, String subject, String htmlContent, String textContent) {
        // Format sender with display name
        String fromHeader = resendFromEmail.contains("<")
                ? resendFromEmail
                : "MentorSync <" + resendFromEmail + ">";

        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("from", fromHeader);
        payload.put("to", List.of(toEmail.trim()));
        payload.put("subject", subject);
        payload.put("html", htmlContent);
        if (textContent != null && !textContent.isBlank()) {
            payload.put("text", textContent);
        }

        try {
            String jsonBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + resendApiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(15))
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                log.info("Successfully sent email to {} via Resend. Status: {}", toEmail, response.statusCode());
            } else {
                String errorDetail = parseResendError(response.statusCode(), response.body());
                log.error("Resend API rejected request for {} with status {}: {}", toEmail, response.statusCode(), response.body());
                throw new ValidationFailedException("Failed to send verification email: " + errorDetail);
            }
        } catch (ValidationFailedException vfe) {
            throw vfe;
        } catch (Exception e) {
            log.error("Unexpected error sending email via Resend to {}: {}", toEmail, e.getMessage(), e);
            throw new ValidationFailedException("Unable to send verification email at this time. Please try again later.");
        }
    }

    private String parseResendError(int statusCode, String responseBody) {
        if (responseBody == null || responseBody.isBlank()) {
            return "Email provider returned HTTP " + statusCode;
        }
        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String message = null;
            if (root.has("message")) {
                message = root.get("message").asText();
            } else if (root.has("error")) {
                message = root.get("error").asText();
            }

            if (statusCode == 403 && message != null && message.contains("only send testing emails")) {
                log.error("\n=================================================================\n" +
                          " [RESEND CONFIGURATION ACTION REQUIRED]\n" +
                          " Resend trial domain (onboarding@resend.dev) is restricted to your\n" +
                          " account owner's email address.\n" +
                          " To send emails to all students and mentors:\n" +
                          " 1. Go to https://resend.com/domains and verify your custom domain\n" +
                          " 2. Set RESEND_FROM_EMAIL to an address on your verified domain\n" +
                          "    (e.g., MentorSync <auth@yourdomain.com>)\n" +
                          "=================================================================");
                return "Trial domain restriction: To send to all emails, add and verify your custom domain on resend.com/domains.";
            }

            if (statusCode == 429) {
                return "Email rate limit exceeded. Please wait a moment and try again.";
            }

            if (message != null && !message.isBlank()) {
                return message;
            }
        } catch (Exception ignored) {
            // fallback
        }
        return responseBody;
    }

    private String buildOtpHtmlTemplate(String greeting, String otp) {
        String template = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Password Reset Code</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7; margin: 0; padding: 24px 12px; color: #1e293b;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #5b4fff; letter-spacing: -0.5px;">MentorSync</h1>
                    <p style="margin: 4px 0 0; font-size: 13px; color: #64748b; font-weight: 500;">LeetCode &amp; Codeforces Progress Tracker</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 28px 32px 20px;">
                    <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 700; color: #0f172a;">Password Reset Request</h2>
                    <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #475569;">
                      Hello{{GREETING}},<br>
                      We received a request to reset your password. Use the verification code below to verify your identity:
                    </p>
                    <!-- OTP Box -->
                    <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #5b4fff; display: inline-block;">{{OTP}}</span>
                    </div>
                    <p style="margin: 0 0 12px; font-size: 13px; color: #64748b; line-height: 20px;">
                      ⏱️ This code is valid for <strong>10 minutes</strong>. For your security, do not share this code with anyone.
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 20px;">
                      If you did not request this change, you can safely disregard this email. Your current password remains active and secure.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px 28px; background-color: #fafafa; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                      &copy; 2026 MentorSync. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
        return template
                .replace("{{GREETING}}", greeting != null ? greeting : "")
                .replace("{{OTP}}", otp != null ? otp : "");
    }

    private String buildStudentRegistrationOtpHtmlTemplate(String greeting, String otp) {
        String template = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify Your Student Email</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7; margin: 0; padding: 24px 12px; color: #1e293b;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #5b4fff; letter-spacing: -0.5px;">MentorSync</h1>
                    <p style="margin: 4px 0 0; font-size: 13px; color: #64748b; font-weight: 500;">LeetCode &amp; Codeforces Progress Tracker</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 28px 32px 20px;">
                    <div style="display: inline-block; padding: 4px 12px; background-color: #e0e7ff; color: #4338ca; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                      Student Registration
                    </div>
                    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #0f172a;">Welcome to MentorSync!{{GREETING}}</h2>
                    <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #475569;">
                      Thank you for creating your student account. To confirm that this email address belongs to you, please enter the 6-digit verification code below:
                    </p>
                    <!-- OTP Box -->
                    <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #5b4fff; display: inline-block;">{{OTP}}</span>
                    </div>
                    <p style="margin: 0 0 12px; font-size: 13px; color: #64748b; line-height: 20px;">
                      ⏱️ This code will expire in <strong>10 minutes</strong>. For your security, do not share this code with anyone.
                    </p>
                    <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 20px;">
                      If you did not initiate this registration, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px 28px; background-color: #fafafa; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                      &copy; 2026 MentorSync. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
        return template
                .replace("{{GREETING}}", greeting != null ? greeting : "")
                .replace("{{OTP}}", otp != null ? otp : "");
    }

    private String buildNudgeHtmlTemplate(String greeting, String assignmentName, String className) {
        String template = """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Pending Assignment Reminder</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7; margin: 0; padding: 24px 12px; color: #1e293b;">
              <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                <!-- Header -->
                <tr>
                  <td style="padding: 32px 32px 20px; text-align: center; border-bottom: 1px solid #f1f5f9;">
                    <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #5b4fff; letter-spacing: -0.5px;">MentorSync</h1>
                    <p style="margin: 4px 0 0; font-size: 13px; color: #64748b; font-weight: 500;">LeetCode &amp; Codeforces Progress Tracker</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 28px 32px 20px;">
                    <div style="display: inline-block; padding: 4px 12px; background-color: #fef3c7; color: #92400e; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                      Assignment Reminder
                    </div>
                    <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #0f172a;">Hi{{GREETING}}!</h2>
                    <p style="margin: 0 0 16px; font-size: 14px; line-height: 22px; color: #475569;">
                      This is a friendly reminder from your mentor that you have a pending assignment for <strong>{{CLASS_NAME}}</strong>:
                    </p>
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
                      <p style="margin: 0; font-size: 16px; font-weight: 700; color: #1e293b;">{{ASSIGNMENT_NAME}}</p>
                    </div>
                    <p style="margin: 0 0 12px; font-size: 14px; color: #475569; line-height: 22px;">
                      Please complete it on LeetCode and check your progress on your MentorSync dashboard as soon as possible.
                    </p>
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #5b4fff;">Happy Coding!</p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px 28px; background-color: #fafafa; border-top: 1px solid #f1f5f9; text-align: center;">
                    <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                      &copy; 2026 MentorSync. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """;
        return template
                .replace("{{GREETING}}", greeting != null ? greeting : "")
                .replace("{{CLASS_NAME}}", className != null ? className : "")
                .replace("{{ASSIGNMENT_NAME}}", assignmentName != null ? assignmentName : "");
    }
}
