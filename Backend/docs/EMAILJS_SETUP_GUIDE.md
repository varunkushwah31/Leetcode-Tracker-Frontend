# EmailJS Zero-Cost Setup Guide for MentorSync

This guide teaches you step-by-step how to set up and configure **EmailJS** for sending **OTP verification codes** (Student Email Verification & Password Reset) **completely free** with **zero domain requirements**.

---

## Why EmailJS is 100% Free & Ideal for Render

| Feature | Resend / SendGrid / Mailgun | Gmail Direct SMTP | **EmailJS (Recommended)** |
|---|---|---|---|
| **Cost** | Free tier requires credit card | Free | **100% Free Forever (200 emails/month)** |
| **Custom Domain Required?** | **YES** (Must own a `.com` domain) | No | **NO** (Works with your personal Gmail/Outlook) |
| **Render Free Tier Compatible?** | Yes (via HTTPS API) | **NO** (Render blocks ports 25, 465, 587) | **YES** (Uses HTTPS REST API over port 443) |
| **Setup Time** | ~24 hours (DNS propagation) | 10 mins (App Passwords) | **3 minutes (Click to connect)** |

---

## 4-Step Setup Guide

### Step 1: Create a Free EmailJS Account
1. Visit [https://www.emailjs.com/](https://www.emailjs.com/) and click **Sign Up Free**.
2. No credit card is required. Verify your email and log in to the EmailJS dashboard.

---

### Step 2: Add an Email Service (Your Personal Gmail / Outlook)
1. In the left navigation sidebar, click **Email Services**.
2. Click **Add New Service**.
3. Choose **Gmail** (or Outlook / Yahoo / personal email).
4. Enter a Name (e.g. `MentorSync Gmail`).
5. Click **Connect Account** and log in with your personal Google account.
6. Grant EmailJS permission to send emails on your behalf.
7. Click **Create Service**.
8. **Copy your Service ID**: It looks like `service_xxxxxxx`.

---

### Step 3: Create the OTP Email Template
1. In the left navigation sidebar, click **Email Templates**.
2. Click **Create New Template**.
3. Click the **Settings** tab (or check the header fields at the top):
   - **To Email:** `{{to_email}}`  
     *(IMPORTANT: This MUST be `{{to_email}}`, NOT your own email address! EmailJS uses this variable to deliver the OTP to the student who requested it).*
   - **From Name:** `MentorSync`
   - **Subject:** `{{subject}}` (or `MentorSync Verification Code: {{otp_code}}`)
   - **Reply-To:** (Optional, leave blank or put your email)
4. Click on the **Content** tab. Switch to the **Code Editor** / HTML mode and paste the minimalistic HTML template below (also available in [`email-templates/email-otp-template.html`](./email-templates/email-otp-template.html) and previewable via [`email-templates/preview.html`](./email-templates/preview.html)):

```html
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Verify Your Email Address</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    body, table, td, a, p, span, div { 
      -webkit-text-size-adjust: 100%; 
      -ms-text-size-adjust: 100%; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif !important;
    }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #f3f4f6; }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .card-padding { padding: 32px 20px 32px !important; }
      .otp-display { font-size: 28px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 48px 12px; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1f2937;">

  <!-- Outer Canvas Table -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        
        <!--[if mso]>
        <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" width="520">
        <tr>
        <td>
        <![endif]-->

        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); overflow: hidden;">
          <tr>
            <td class="card-padding" style="padding: 44px 40px 40px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              
              <!-- Brand Logo (Clean Royal Blue 3-Pill Geometric Glyph) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 24px;">
                <tr>
                  <td align="center">
                    <svg width="44" height="34" viewBox="0 0 44 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                      <path d="M10 6L15 28" stroke="#968FFF" stroke-width="5.5" stroke-linecap="round" />
                      <path d="M20 6L25 28" stroke="#968FFF" stroke-width="5.5" stroke-linecap="round" />
                      <path d="M30 6L35 28" stroke="#968FFF" stroke-width="5.5" stroke-linecap="round" />
                    </svg>
                  </td>
                </tr>
              </table>

              <!-- Main Heading -->
              <h1 style="margin: 0 0 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 700; color: #111827; text-align: center; letter-spacing: -0.4px; line-height: 1.3;">
                Verify Your Email Address
              </h1>

              <!-- Subtitle -->
              <p style="margin: 0 0 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280; text-align: center; line-height: 1.5;">
                Thank you for registering with {{app_name}}
              </p>

              <!-- Salutation & Body Copy -->
              <p style="margin: 0 0 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #111827;">
                Hello {{user_name}},
              </p>
              <p style="margin: 0 0 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #4b5563;">
                Welcome to {{app_name}}! We're excited to have you on board. To complete your registration and verify your account, please enter the one-time verification code below:
              </p>

              <!-- Minimalist OTP Code Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 0 24px;">
                <tr>
                  <td align="center" style="padding: 24px 16px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #64748b; margin-bottom: 8px;">
                      Verification Code
                    </div>
                    <div class="otp-display" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 34px; font-weight: 700; letter-spacing: 8px; color: #0f172a; margin: 4px 0 6px; line-height: 1.2;">
                      {{otp_code}}
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #64748b; font-weight: 500; margin-top: 6px;">
                      Valid for {{expiry_minutes}} minutes &bull; Do not share this code
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Notice Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb; border: 1px solid #eaecf0; border-radius: 10px; margin: 0;">
                <tr>
                  <td style="padding: 14px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td valign="top" style="width: 20px; padding-right: 12px; padding-top: 2px;">
                          <!-- Security Shield with Checkmark Icon -->
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#968FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="m9 12 2 2 4-4" />
                          </svg>
                        </td>
                        <td valign="top" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 2px;">
                            Security Notice
                          </div>
                          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #4b5563; line-height: 1.5;">
                            This verification code will expire in {{expiry_minutes}} minutes. For your security, please do not share this email or code with anyone.
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>
        </table>
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->

        <!-- Minimal Automated Note (Subtle, Non-intrusive) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
          <tr>
            <td align="center" style="padding: 20px 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9ca3af; line-height: 1.5; text-align: center;">
              This is an automated verification message from {{app_name}}. Please do not reply.
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>
```

5. Click **Save** in the top right.
6. **Copy your Template ID**: It looks like `template_xxxxxxx`.

---

### Step 4: Get Your EmailJS API Keys
1. In the bottom left (or top right), click **Account**.
2. Scroll to the **API Keys** section:
   - **Public Key** (formerly User ID): Copy this string (e.g., `aB1c2D3e4F5g6H7i8`).
3. In the Account page, switch to the **Security** tab:
   - Find your **Private Key** (Access Token): Copy this string (e.g., `xYz1234567890abcdef`).
   - Ensure the toggle **"Allow EmailJS API for non-browser applications"** is turned **ON** (or check that requests with private key are allowed).

---

## Step 5: Configure in Render & Locally

You now have all 4 required credentials:
- `EMAILJS_SERVICE_ID`: `service_xxxxxxx`
- `EMAILJS_TEMPLATE_ID`: `template_xxxxxxx`
- `EMAILJS_PUBLIC_KEY`: `your_public_key`
- `EMAILJS_PRIVATE_KEY`: `your_private_key`

### On Render.com (Production)
1. Go to your backend service on [dashboard.render.com](https://dashboard.render.com).
2. Go to **Environment** tab.
3. Add or update these environment variables:
   ```env
   EMAILJS_SERVICE_ID=service_xxxxxxx
   EMAILJS_TEMPLATE_ID=template_xxxxxxx
   EMAILJS_PUBLIC_KEY=your_public_key
   EMAILJS_PRIVATE_KEY=your_private_key
   REQUIRE_STUDENT_EMAIL_VERIFICATION=true
   ```
4. Click **Save Changes**. Render will automatically redeploy with real email delivery enabled!

### For Local Development (`.env` or `application.properties`)
```properties
emailjs.service-id=service_xxxxxxx
emailjs.template-id=template_xxxxxxx
emailjs.public-key=your_public_key
emailjs.private-key=your_private_key
application.auth.student-email-verification=true
```

---

## Testing Your EmailJS Setup Instantly

You don't need to register a fake student or trigger a forgotten password to verify delivery. We built a direct test endpoint into MentorSync:

### Method 1: Using cURL or Postman
Run this command from your terminal:
```bash
curl -X POST "https://leettracker-backend-nq7r.onrender.com/api/v1/auth/test-email?email=your_personal_email@gmail.com"
```
Or locally:
```bash
curl -X POST "http://localhost:8080/api/v1/auth/test-email?email=your_personal_email@gmail.com"
```

### Expected Response:
```json
{
  "status": "SUCCESS",
  "message": "Test verification email dispatched successfully to your_personal_email@gmail.com",
  "provider": "EMAILJS",
  "emailJsConfigured": true
}
```
Within 3 to 5 seconds, open your inbox — you will receive the styled verification email with code `123456`!

---

## Template Variable Reference

The MentorSync backend automatically populates all common variable names, so your template will work no matter which alias you use:

| Variable | Description | Example Value |
|---|---|---|
| `{{to_email}}` or `{{email}}` | Recipient email address | `student@example.com` |
| `{{otp_code}}` or `{{otp}}` or `{{code}}` | The 6-digit numeric OTP | `492015` |
| `{{user_name}}` or `{{name}}` | Student / User display name | `Alice Smith` |
| `{{subject}}` | Email subject line | `MentorSync - Verify Your Email: 492015` |
| `{{expiry_minutes}}` | Validity period in minutes | `10` |
| `{{app_name}}` | Platform name | `MentorSync` |
