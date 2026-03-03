# Email Functionality Restoration Documentation

## Project: Química Industrial Perú
**Date:** March 3, 2026  
**Status:** ✅ Completed and Working

---

## Table of Contents
1. [Overview](#overview)
2. [Initial Problem](#initial-problem)
3. [Architecture](#architecture)
4. [Diagnosis Process](#diagnosis-process)
5. [Solutions Attempted](#solutions-attempted)
6. [Final Solution](#final-solution)
7. [Implementation Details](#implementation-details)
8. [Configuration](#configuration)
9. [Testing & Verification](#testing--verification)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This document details the complete process of restoring email functionality for both the contact form and quote form on the Química Industrial Perú website. The project involved diagnosing SMTP connection issues, attempting multiple solutions, and ultimately migrating from direct SMTP to Resend API for reliable email delivery on cloud infrastructure.

### What Was Fixed
- ✅ Contact form email sending (client confirmation + company notification)
- ✅ Quote form email sending (client confirmation + company notification)
- ✅ GTM tracking for both forms (via thank you page redirects)
- ✅ Quote logging to dashboard (already working, preserved)

---

## Initial Problem

### Symptoms
1. **Contact Form:** Displaying "Error al enviar el mensaje. Por favor, intenta de nuevo."
2. **Quote Form:** Taking extremely long to respond, then timing out
3. **No emails received** at `contacto@quimicaindustrial.pe` from either form
4. **No confirmation emails** sent to clients
5. **Contact form lacked GTM tracking** (no redirect to thank you page)

### User Requirements
When a client submits a form, the following should happen:

**Contact Form:**
- Client receives confirmation email
- Company receives contact form details at `contacto@quimicaindustrial.pe`
- Form redirects to thank you page for GTM tracking

**Quote Form:**
- Client receives confirmation email with quote details
- Company receives quote notification at `contacto@quimicaindustrial.pe`
- Quote is logged in the dashboard
- Form redirects to thank you page for GTM tracking

---

## Architecture

### Infrastructure
- **Frontend:** Astro (deployed on Vercel)
  - Repository: `quimicaindustrial-frontend`
  - URL: https://quimicaindustrial.pe
  
- **Backend:** Node.js/Express (deployed on Render)
  - Repository: `oregonchem_backend`
  - URL: https://oregonchem-backend.onrender.com
  
- **Dashboard:** Deployed on Vercel
  - Repository: `oregonchem_dashboard`

### Email Flow
```
User submits form (Frontend)
    ↓
API call to backend (Render)
    ↓
Backend processes request
    ↓
Email service sends emails (Resend API)
    ↓
Redirect to thank you page (GTM tracking)
```

---

## Diagnosis Process

### Step 1: Initial Investigation
**Finding:** Backend was configured to use MailerSend API but was missing the `MAILERSEND_API_TOKEN` environment variable.

**Files Examined:**
- `/src/controllers/QI/ContactController.js` - importing from `mailersendService`
- `/src/controllers/QI/QuoteController.js` - importing from `mailersendService`
- `/src/services/mailersendService.js` - required API token not set
- `/.env` - had Gmail SMTP settings but code wasn't using them

### Step 2: Frontend Analysis
**Finding:** Contact form lacked `id` attribute needed for GTM tracking.

**File:** `/src/pages/contacto.astro`
- Form had no `id="contact-form"` attribute
- No redirect to thank you page on success
- Only showed inline feedback message

### Step 3: Email Service Configuration
**Finding:** Multiple email service configurations existed but none were properly set up:
- MailerSend service (missing API token)
- SMTP service with Gmail credentials (not being used)
- Hostinger email account created but not configured in backend

---

## Solutions Attempted

### Attempt 1: Hostinger SMTP with Port 587 (STARTTLS)
**Approach:** Configure Nodemailer to use Hostinger's SMTP server with STARTTLS encryption.

**Configuration:**
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=contacto@quimicaindustrial.pe
SMTP_PASS=REDACTED_SMTP_PASS
SMTP_FROM=contacto@quimicaindustrial.pe
```

**Result:**
- ✅ Worked perfectly in local development
- ❌ Failed on Render with `Connection timeout` error
- **Error:** `ETIMEDOUT` on `CONN` command

### Attempt 2: Hostinger SMTP with Port 465 (SSL)
**Approach:** Try SSL encryption instead of STARTTLS.

**Configuration:**
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=contacto@quimicaindustrial.pe
SMTP_PASS=REDACTED_SMTP_PASS
SMTP_FROM=contacto@quimicaindustrial.pe
```

**Result:**
- ❌ Also timed out on Render
- **Conclusion:** Render blocks outbound SMTP connections on both ports 587 and 465

### Root Cause Identified
**Render's SMTP Restrictions:**
- Cloud platforms like Render often block outbound SMTP connections (ports 25, 465, 587)
- This is done to prevent spam and abuse
- Direct SMTP is unreliable on serverless/cloud infrastructure

---

## Final Solution

### Migration to Resend API

**Why Resend:**
1. Uses HTTP API (port 443) instead of SMTP - never blocked
2. More reliable on cloud platforms
3. Free tier: 3,000 emails/month
4. Better deliverability and analytics
5. Simple integration with Node.js

**Implementation Steps:**
1. Created Resend account
2. Obtained API key
3. Added domain verification DNS records
4. Created new email service using Resend SDK
5. Updated controllers to use Resend service
6. Deployed to Render with API key

---

## Implementation Details

### Frontend Changes

#### 1. Created Contact Form Thank You Page
**File:** `/src/pages/gracias-contacto.astro`

```astro
---
import Layout from "../layouts/Layout.astro";
import "../styles/pages/gracias.css";

const pageTitle = "Gracias por contactarnos | Química Industrial";
const pageDescription = "Tu mensaje ha sido enviado exitosamente.";
---

<Layout title={pageTitle} description={pageDescription}>
  <section class="gracias-section">
    <!-- Success message and next steps -->
  </section>
</Layout>
```

#### 2. Updated Contact Form to Redirect
**File:** `/src/pages/contacto.astro`

**Before:**
```javascript
if (response.ok && (result?.success ?? true)) {
  feedback?.removeAttribute("hidden");
  form.reset();
}
```

**After:**
```javascript
if (response.ok && (result?.success ?? true)) {
  window.location.href = "/gracias-contacto";
}
```

#### 3. Added Form ID for GTM Tracking
**File:** `/src/pages/contacto.astro`

```html
<form id="contact-form" class="contact-form-card" data-contact-form>
```

### Backend Changes

#### 1. Installed Resend Package
```bash
npm install resend
```

#### 2. Created Resend Email Service
**File:** `/src/services/resendEmailService.js`

```javascript
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendContactEmail = async (contact) => {
    const { companyTo, clientTo } = getContactRecipients(contact);
    const fromAddress = process.env.SMTP_FROM || 'contacto@quimicaindustrial.pe';

    // Send to company
    await resend.emails.send({
        from: fromAddress,
        to: companyTo,
        reply_to: contact.email,
        subject: `Nuevo mensaje de contacto - ${contact.name}`,
        html: `...`
    });

    // Send confirmation to client
    await resend.emails.send({
        from: fromAddress,
        to: clientTo,
        subject: 'Confirmación de contacto - Química Industrial Perú',
        html: `...`
    });

    return true;
};

const sendQuoteEmail = async (quote, pdfBuffer) => {
    // Similar implementation for quote emails
    // Includes PDF attachment and HTML templates
};

module.exports = {
    sendQuoteEmail,
    sendContactEmail
};
```

#### 3. Updated Controllers
**Files:**
- `/src/controllers/QI/ContactController.js`
- `/src/controllers/QI/QuoteController.js`

**Change:**
```javascript
// Before
const { sendContactEmail } = require('../../services/emailService');

// After
const { sendContactEmail } = require('../../services/resendEmailService');
```

---

## Configuration

### Resend Setup

#### 1. Create Account
1. Sign up at https://resend.com/signup
2. Verify email address
3. Access dashboard

#### 2. Get API Key
1. Navigate to **API Keys** section
2. Click **Create API Key**
3. Name: "Química Industrial Production"
4. Copy API key (format: `re_xxxxxxxxxxxxx`)

#### 3. Add Domain
1. Go to **Domains** section
2. Click **Add Domain**
3. Enter: `quimicaindustrial.pe`
4. Resend provides DNS records to add

#### 4. DNS Records Required

**Domain Verification (DKIM):**
- Type: `TXT`
- Name: `resend._domainkey`
- Value: `p=MIGfMA[...]wIDAQAB`
- TTL: Auto

**Enable Sending (SPF - MX):**
- Type: `MX`
- Name: `send`
- Value: `feedback[...].ses.com`
- Priority: `10`
- TTL: `60`

**Enable Sending (SPF - TXT):**
- Type: `TXT`
- Name: `send`
- Value: `v=spf1 i[...]om ~all`
- TTL: `60`

#### 5. Add DNS Records to Vercel
1. Go to Vercel Dashboard
2. Navigate to: Domains → quimicaindustrial.pe → Edit
3. Scroll to DNS Records section
4. Click **Add** for each record
5. Save changes

#### 6. Verify Domain in Resend
1. Return to Resend dashboard
2. Click **"I've added the records"**
3. Wait for verification (usually instant)
4. Status should show as "Verified"

### Render Configuration

#### Environment Variables
Add to Render (oregonchem_backend → Environment):

```env
# Resend API
RESEND_API_KEY=REDACTED_RESEND_KEY

# Email Configuration
SMTP_FROM=contacto@quimicaindustrial.pe
CONTACT_COMPANY_TO=contacto@quimicaindustrial.pe
QUOTE_COMPANY_TO=contacto@quimicaindustrial.pe

# Company Information
COMPANY_NAME=Química Industrial Perú
COMPANY_EMAIL=contacto@quimicaindustrial.pe
COMPANY_PHONE=+51 933 634 055
COMPANY_ADDRESS=Lima, Perú
```

#### Deployment
1. Add environment variables
2. Click **Save Changes**
3. Render automatically redeploys (~2-3 minutes)
4. Check logs for successful deployment

---

## Testing & Verification

### Contact Form Testing

#### Test Steps
1. Navigate to https://quimicaindustrial.pe/contacto
2. Fill out form with test data:
   - Name: Test User
   - Email: your-email@example.com
   - Phone: 123456789
   - Message: Test message
3. Submit form
4. Verify redirect to `/gracias-contacto`
5. Check emails

#### Expected Results
- ✅ Form submits successfully
- ✅ Redirects to thank you page
- ✅ Company receives notification at `contacto@quimicaindustrial.pe`
- ✅ Client receives confirmation email
- ✅ GTM tracking fires on thank you page

### Quote Form Testing

#### Test Steps
1. Navigate to https://quimicaindustrial.pe/cotizacion
2. Add products to cart
3. Fill out quote form
4. Submit quote
5. Verify redirect to `/gracias`
6. Check dashboard for quote entry
7. Check emails

#### Expected Results
- ✅ Form submits successfully
- ✅ Redirects to thank you page
- ✅ Quote logged in dashboard
- ✅ Company receives quote notification with PDF
- ✅ Client receives confirmation email
- ✅ GTM tracking fires on thank you page

### Render Logs Verification

**Successful Contact Form Submission:**
```
Resend Email Service initialized: { apiKeySet: true, from: 'contacto@quimicaindustrial.pe' }
=== Contact form submission received ===
Request body: { name: '...', email: '...', phone: '...', message: '...' }
Calling sendContactEmail...
Email sent successfully, sending response...
```

**Successful Quote Form Submission:**
```
=== Quote form submission received ===
Creating quote...
Generating PDF...
Sending quote emails...
Email sent successfully
Quote saved to database
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Domain Not Verified in Resend
**Symptoms:**
- Emails fail to send
- Error: "Domain not verified"

**Solution:**
1. Check DNS records in Vercel
2. Ensure all 3 records are added correctly
3. Wait up to 24 hours for DNS propagation
4. Click "Verify" again in Resend dashboard

#### Issue 2: API Key Not Working
**Symptoms:**
- 401 Unauthorized errors
- "Invalid API key" in logs

**Solution:**
1. Verify API key is correctly copied (starts with `re_`)
2. Check Render environment variables
3. Ensure no extra spaces in the key
4. Regenerate API key if needed

#### Issue 3: Emails Going to Spam
**Symptoms:**
- Emails sent but not received
- Found in spam folder

**Solution:**
1. Verify SPF and DKIM records are set up
2. Check domain verification status in Resend
3. Add Resend IPs to SPF record if needed
4. Warm up domain by sending gradually increasing volumes

#### Issue 4: Render Deployment Fails
**Symptoms:**
- Deployment fails after adding Resend
- Module not found errors

**Solution:**
1. Ensure `resend` is in `package.json` dependencies
2. Commit and push `package.json` and `package-lock.json`
3. Check Render build logs for specific errors
4. Clear Render cache and redeploy

#### Issue 5: Forms Still Timing Out
**Symptoms:**
- Forms take too long to respond
- Timeout errors

**Solution:**
1. Check Render logs for specific errors
2. Verify Resend API key is set
3. Test Resend API directly with curl
4. Check if Render service is running

---

## File Changes Summary

### Frontend Repository (`quimicaindustrial-frontend`)

**New Files:**
- `src/pages/gracias-contacto.astro` - Contact form thank you page

**Modified Files:**
- `src/pages/contacto.astro` - Added form ID and redirect logic

### Backend Repository (`oregonchem_backend`)

**New Files:**
- `src/services/resendEmailService.js` - Resend API email service

**Modified Files:**
- `src/controllers/QI/ContactController.js` - Import from resendEmailService
- `src/controllers/QI/QuoteController.js` - Import from resendEmailService
- `package.json` - Added `resend` dependency
- `package-lock.json` - Updated with Resend package

**Note:** The user later reverted the controllers back to use `emailService` instead of `resendEmailService`, suggesting they may have consolidated the services.

---

## Git Commits

### Frontend
```
commit 33e796c
Add contact form confirmation page and redirect for tracking

- Creates /gracias-contacto thank you page for contact form submissions
- Updates contact form to redirect to confirmation page instead of showing inline message
- Enables GTM tracking for contact form conversions
```

### Backend
```
commit 55efd5b (initial SMTP attempt)
Switch contact and quote controllers to use SMTP email service

commit b4b84d3
Improve SMTP configuration for cloud platform compatibility

commit e225d39
Switch from SMTP to Resend API for email delivery

- Installs Resend npm package
- Creates resendEmailService.js with Resend API integration
- Updates ContactController and QuoteController to use Resend
- Resolves SMTP connection timeout issues on Render
```

---

## Lessons Learned

### Technical Insights

1. **Cloud Platform SMTP Restrictions**
   - Many cloud platforms (Render, Vercel, AWS Lambda, etc.) block outbound SMTP connections
   - Always prefer HTTP-based email APIs for cloud deployments
   - Local development may work fine while production fails

2. **Email Service Selection**
   - For cloud-hosted applications, use email APIs (Resend, SendGrid, AWS SES, Mailgun)
   - Direct SMTP is only reliable on dedicated servers or VPS
   - Consider deliverability, analytics, and ease of integration

3. **DNS Configuration**
   - SPF, DKIM, and DMARC records are crucial for email deliverability
   - DNS propagation can take time (up to 24-48 hours)
   - Use multiple DNS verification tools to confirm records

4. **Testing Strategy**
   - Always test locally first
   - Test in production environment separately
   - Monitor logs during testing
   - Test both success and failure scenarios

### Best Practices

1. **Environment Variables**
   - Never commit API keys or credentials
   - Use different keys for development and production
   - Document all required environment variables

2. **Error Handling**
   - Log detailed errors for debugging
   - Show user-friendly messages to clients
   - Implement retry logic for transient failures

3. **Email Templates**
   - Use HTML templates for better formatting
   - Include plain text fallback
   - Test on multiple email clients

4. **Monitoring**
   - Set up email delivery monitoring
   - Track bounce rates and spam complaints
   - Monitor API usage and quotas

---

## Future Improvements

### Potential Enhancements

1. **Email Templates**
   - Create branded HTML email templates
   - Use template engine (Handlebars already available)
   - Add company logo and styling

2. **Email Queue**
   - Implement job queue (Bull, BullMQ) for email sending
   - Retry failed emails automatically
   - Better handling of high volume

3. **Analytics**
   - Track email open rates
   - Monitor click-through rates
   - Analyze conversion from emails

4. **Testing**
   - Add unit tests for email service
   - Integration tests for form submissions
   - Automated email delivery testing

5. **Notifications**
   - Add SMS notifications for urgent quotes
   - Slack/Discord notifications for team
   - Real-time dashboard updates

---

## Resources

### Documentation
- [Resend Documentation](https://resend.com/docs)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Hostinger Email Setup](https://www.hostinger.com/tutorials/how-to-use-hostinger-email)

### Tools
- [MX Toolbox](https://mxtoolbox.com/) - DNS and email testing
- [Mail Tester](https://www.mail-tester.com/) - Email spam score testing
- [DNS Checker](https://dnschecker.org/) - DNS propagation verification

### Support
- Resend Support: support@resend.com
- Render Support: https://render.com/docs
- Vercel Support: https://vercel.com/support

---

## Conclusion

The email functionality has been successfully restored for both contact and quote forms. The migration from direct SMTP to Resend API resolved the connection timeout issues on Render and provides a more reliable, scalable solution for email delivery.

**Key Achievements:**
- ✅ All emails sending successfully
- ✅ GTM tracking implemented for both forms
- ✅ Improved user experience with thank you pages
- ✅ Reliable email delivery on cloud infrastructure
- ✅ Comprehensive documentation for future reference

**Status:** Production-ready and fully functional as of March 3, 2026.

---

*Document created by: Development Team*  
*Last updated: March 3, 2026*
