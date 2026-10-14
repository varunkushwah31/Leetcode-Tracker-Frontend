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
      background-color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0f172a;
      padding: 40px 10px;
    }
    .main {
      background-color: #1e293b;
      margin: 0 auto;
      width: 100%;
      max-width: 540px;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid #334155;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .header p {
      color: #c7d2fe;
      margin: 6px 0 0 0;
      font-size: 13px;
      font-weight: 500;
    }
    .content {
      padding: 32px 28px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 12px;
    }
    .body-text {
      font-size: 14px;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .otp-box {
      background-color: #0f172a;
      border: 2px dashed #6366f1;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 24px 0;
    }
    .otp-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #818cf8;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .otp-code {
      font-family: 'SF Mono', Consolas, Monaco, monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #ffffff;
      margin: 0;
      padding: 4px 0;
    }
    .expiry {
      display: inline-block;
      margin-top: 10px;
      font-size: 12px;
      color: #f59e0b;
      font-weight: 500;
    }
    .warning {
      background-color: rgba(239, 68, 68, 0.1);
      border-left: 3px solid #ef4444;
      padding: 12px 16px;
      border-radius: 6px;
      margin-top: 24px;
      font-size: 12px;
      color: #fca5a5;
      line-height: 1.5;
    }
    .footer {
      border-top: 1px solid #334155;
      padding: 20px 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      background-color: #172033;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="main">
      <div class="header">
        <h1>⚡ MentorSync</h1>
        <p>LeetCode & Codeforces Automated Classroom Platform</p>
      </div>
      <div class="content">
        <div class="greeting">Hello {{user_name}},</div>
        <div class="body-text">
          We received a verification request for your MentorSync account. Please use the one-time verification code below to complete your action:
        </div>
        <div class="otp-box">
          <div class="otp-label">One-Time Verification Code</div>
          <div class="otp-code">{{otp_code}}</div>
          <div class="expiry">⏱ Valid for {{expiry_minutes}} minutes</div>
        </div>
        <div class="body-text" style="margin-bottom: 0;">
          If you did not make this request, you can safely ignore this email. No changes will be applied to your account without this code.
        </div>
        <div class="warning">
          <strong>Security Notice:</strong> Never share this verification code with anyone. MentorSync mentors or staff will never ask for your OTP.
        </div>
      </div>
      <div class="footer">
        © MentorSync • Automated Competitive Programming Performance Tracker
      </div>
    </div>
  </div>
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
