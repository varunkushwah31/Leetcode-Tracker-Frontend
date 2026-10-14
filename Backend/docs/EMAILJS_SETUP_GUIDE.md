# 📧 EmailJS Zero-Cost Setup Guide for MentorSync

This guide teaches you step-by-step how to set up and configure **EmailJS** for sending **OTP verification codes** (Student Email Verification & Password Reset) **completely free** with **zero domain requirements**.

---

## 💡 Why EmailJS is 100% Free & Ideal for Render

| Feature | Resend / SendGrid / Mailgun | Gmail Direct SMTP | **EmailJS (Recommended)** |
|---|---|---|---|
| **Cost** | Free tier requires credit card | Free | **100% Free Forever (200 emails/month)** |
| **Custom Domain Required?** | **YES** (Must own a `.com` domain) | No | **NO** (Works with your personal Gmail/Outlook) |
| **Render Free Tier Compatible?** | Yes (via HTTPS API) | **NO** (Render blocks ports 25, 465, 587) | **YES** (Uses HTTPS REST API over port 443) |
| **Setup Time** | ~24 hours (DNS propagation) | 10 mins (App Passwords) | **3 minutes (Click to connect)** |

---

## 🚀 4-Step Setup Guide

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
     *(⚠️ IMPORTANT: This MUST be `{{to_email}}`, NOT your own email address! EmailJS uses this variable to deliver the OTP to the student who requested it).*
   - **From Name:** `MentorSync`
   - **Subject:** `{{subject}}` (or `MentorSync Verification Code: {{otp_code}}`)
   - **Reply-To:** (Optional, leave blank or put your email)
4. Click on the **Content** tab. Switch to the **Code Editor** / HTML mode and paste the HTML template below:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MentorSync Verification Code</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #09090b;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f4f4f5;
      -webkit-font-smoothing: antialiased;
    }
    .email-container {
      max-width: 480px;
      margin: 0 auto;
      background-color: #121217;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #27272a;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);
    }
    @media only screen and (max-width: 480px) {
      .email-container {
        border-radius: 12px !important;
      }
      .content-padding {
        padding: 24px 16px !important;
      }
      .otp-code-text {
        font-size: 24px !important;
        letter-spacing: 3px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 32px 12px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="max-width: 480px; margin: 0 auto; background-color: #121217; border-radius: 16px; overflow: hidden; border: 1px solid #27272a; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6);">
          <!-- Top Accent Gradient Line -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #5b4fff 0%, #8b5cf6 50%, #3b82f6 100%);"></td>
          </tr>
          <!-- Brand Header -->
          <tr>
            <td align="center" style="padding: 28px 24px 14px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="width: 42px; height: 42px; background: linear-gradient(135deg, #5b4fff 0%, #7c3aed 100%); border-radius: 12px; text-align: center; vertical-align: middle; box-shadow: 0 4px 14px rgba(91, 79, 255, 0.4);">
                    <span style="color: #ffffff; font-size: 20px; font-weight: 900; line-height: 42px; display: inline-block;">⚡</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 12px 0 0; letter-spacing: -0.3px;">MentorSync</h1>
              <p style="color: #71717a; font-size: 11px; font-weight: 600; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px;">Security &amp; Account Verification</p>
            </td>
          </tr>
          <!-- Content Body -->
          <tr>
            <td class="content-padding" style="padding: 12px 28px 28px;">
              <div style="font-size: 15px; font-weight: 700; color: #f4f4f5; margin-bottom: 8px;">
                Hi {{user_name}},
              </div>
              <div style="font-size: 13px; line-height: 1.6; color: #a1a1aa; margin-bottom: 20px;">
                We received a request to verify your email address. Use the one-time verification code below to complete your action:
              </div>

              <!-- Modern OTP Box (Mobile-Responsive & Overflow-Safe) -->
              <div style="background-color: #181820; border: 1px solid rgba(91, 79, 255, 0.35); border-radius: 14px; padding: 20px 10px; text-align: center; margin: 20px 0; box-shadow: 0 4px 20px rgba(91, 79, 255, 0.08);">
                <div style="font-size: 10px; font-weight: 700; color: #968fff; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                  Verification Code
                </div>
                <div class="otp-code-text" style="font-family: 'SF Mono', Consolas, Menlo, Monaco, monospace; font-size: 26px; font-weight: 800; letter-spacing: 4px; color: #ffffff; margin: 4px 0; word-break: break-all; overflow-wrap: break-word; max-width: 100%;">
                  {{otp_code}}
                </div>
                <div style="margin-top: 10px;">
                  <span style="display: inline-block; background-color: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.3); color: #fbbf24; border-radius: 9999px; padding: 3px 12px; font-size: 11px; font-weight: 600;">
                    ⏱ Valid for {{expiry_minutes}} minutes
                  </span>
                </div>
              </div>

              <div style="font-size: 12px; line-height: 1.5; color: #71717a; margin-top: 18px;">
                If you did not request this code, you can safely ignore this email. No changes will be applied to your account without this verification.
              </div>

              <!-- Security Notice -->
              <div style="background-color: rgba(255, 255, 255, 0.03); border: 1px solid #27272a; border-radius: 10px; padding: 12px 14px; margin-top: 20px; font-size: 11px; color: #a1a1aa; line-height: 1.5;">
                <span style="color: #968fff; font-weight: 700;">🔒 Security Notice:</span> Never share this code with anyone. MentorSync mentors or staff will never ask for your verification code.
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 16px 24px; background-color: #0c0c10; border-top: 1px solid #1f1f23; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #52525b; line-height: 1.5;">
                MentorSync • LeetCode &amp; Codeforces Automated Platform<br>
                This is an automated security notification. Please do not reply directly.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

*(Optional) If you prefer a clean **Light Theme** (Stripe / GitHub style), use this alternative template:*

<details>
<summary>👉 Click to expand MentorSync Studio Light Theme HTML</summary>

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MentorSync Verification Code</title>
</head>
<body style="margin: 0; padding: 32px 12px; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e4e4e7; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);">
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #5b4fff 0%, #8b5cf6 50%, #3b82f6 100%);"></td>
          </tr>
          <tr>
            <td align="center" style="padding: 28px 24px 14px; text-align: center;">
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="width: 42px; height: 42px; background: #5b4fff; border-radius: 12px; text-align: center; vertical-align: middle;">
                    <span style="color: #ffffff; font-size: 20px; font-weight: 900; line-height: 42px; display: inline-block;">⚡</span>
                  </td>
                </tr>
              </table>
              <h1 style="color: #18181b; font-size: 20px; font-weight: 800; margin: 12px 0 0; letter-spacing: -0.3px;">MentorSync</h1>
              <p style="color: #71717a; font-size: 11px; font-weight: 600; margin: 4px 0 0; text-transform: uppercase; letter-spacing: 1px;">Security &amp; Account Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 28px 28px;">
              <div style="font-size: 15px; font-weight: 700; color: #18181b; margin-bottom: 8px;">
                Hi {{user_name}},
              </div>
              <div style="font-size: 13px; line-height: 1.6; color: #52525b; margin-bottom: 20px;">
                We received a request to verify your email address. Use the one-time verification code below to complete your action:
              </div>
              <div style="background-color: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 14px; padding: 20px 10px; text-align: center; margin: 20px 0;">
                <div style="font-size: 10px; font-weight: 700; color: #5b4fff; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                  Verification Code
                </div>
                <div style="font-family: 'SF Mono', Consolas, Menlo, Monaco, monospace; font-size: 26px; font-weight: 800; letter-spacing: 4px; color: #4338ca; margin: 4px 0; word-break: break-all; overflow-wrap: break-word;">
                  {{otp_code}}
                </div>
                <div style="margin-top: 10px;">
                  <span style="display: inline-block; background-color: #fef3c7; border: 1px solid #fde68a; color: #b45309; border-radius: 9999px; padding: 3px 12px; font-size: 11px; font-weight: 600;">
                    ⏱ Valid for {{expiry_minutes}} minutes
                  </span>
                </div>
              </div>
              <div style="font-size: 12px; line-height: 1.5; color: #71717a; margin-top: 18px;">
                If you did not request this code, you can safely ignore this email.
              </div>
              <div style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 10px; padding: 12px 14px; margin-top: 20px; font-size: 11px; color: #52525b; line-height: 1.5;">
                <span style="color: #5b4fff; font-weight: 700;">🔒 Security Notice:</span> Never share this code with anyone. MentorSync mentors or staff will never ask for your verification code.
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 24px; background-color: #fafafa; border-top: 1px solid #f4f4f5; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #71717a; line-height: 1.5;">
                MentorSync • LeetCode &amp; Codeforces Automated Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

</details>

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

## ⚙️ Step 5: Configure in Render & Locally

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

## 🧪 Testing Your EmailJS Setup Instantly

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

## 📝 Template Variable Reference

The MentorSync backend automatically populates all common variable names, so your template will work no matter which alias you use:

| Variable | Description | Example Value |
|---|---|---|
| `{{to_email}}` or `{{email}}` | Recipient email address | `student@example.com` |
| `{{otp_code}}` or `{{otp}}` or `{{code}}` | The 6-digit numeric OTP | `492015` |
| `{{user_name}}` or `{{name}}` | Student / User display name | `Alice Smith` |
| `{{subject}}` | Email subject line | `MentorSync - Verify Your Email: 492015` |
| `{{expiry_minutes}}` | Validity period in minutes | `10` |
| `{{app_name}}` | Platform name | `MentorSync` |
