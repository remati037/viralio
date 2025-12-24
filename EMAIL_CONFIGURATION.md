# Email Configuration Guide

## Issue: Confirmation Emails Not Sending

When creating users via the admin API, confirmation emails may not be sent automatically. This is a known limitation when using Supabase's admin API.

## Solutions

### Solution 1: Configure Custom SMTP (Recommended for Production)

1. **Go to Supabase Dashboard** → **Project Settings** → **Auth** → **SMTP Settings**
2. **Configure your SMTP provider** (Gmail, SendGrid, Mailgun, etc.)
3. **Enable SMTP** and enter your credentials
4. **Test the configuration**

Once SMTP is configured, `inviteUserByEmail` will automatically send emails.

### Solution 2: Use Supabase's Default Email Service (Development Only)

Supabase's default email service has limitations:
- Low rate limits
- May not work reliably in all regions
- Intended for development/testing only

To use it:
1. **Go to Supabase Dashboard** → **Project Settings** → **Auth** → **Email Templates**
2. **Verify "Confirm signup" template is enabled**
3. **Check email settings are not disabled**

### Solution 3: Manual Email Resending

If emails aren't sent automatically, you can:

1. **Use the resend confirmation API endpoint**:
   ```
   POST /api/admin/users/[userId]/resend-confirmation
   ```

2. **Or manually resend from Supabase Dashboard**:
   - Go to **Authentication** → **Users**
   - Find the user
   - Click **Resend confirmation email**

### Solution 4: Check Email Settings

1. **Verify email is enabled**:
   - Dashboard → **Auth** → **Settings** → **Email Auth** should be enabled

2. **Check email templates**:
   - Dashboard → **Auth** → **Email Templates**
   - Ensure "Confirm signup" template exists and is active

3. **Check site URL**:
   - Dashboard → **Auth** → **URL Configuration**
   - Ensure your site URL and redirect URLs are configured correctly

## Current Implementation

The code uses `inviteUserByEmail` which should automatically send confirmation emails when:
- SMTP is properly configured, OR
- Supabase's default email service is working

If emails aren't being sent:
1. Check Supabase Dashboard logs for email sending errors
2. Verify SMTP configuration
3. Check spam/junk folders
4. Use the resend confirmation endpoint if needed

## Testing

To test if emails are working:
1. Create a test user via admin dashboard
2. Check Supabase Dashboard → **Authentication** → **Users** → check if user was created
3. Check Supabase Dashboard → **Logs** → look for email sending errors
4. Check your email (including spam folder)

## Troubleshooting

### Emails not sending at all
- Check SMTP configuration
- Verify email service is enabled in Supabase
- Check Supabase status page for service issues
- Review Supabase logs for errors

### Emails going to spam
- Configure SPF/DKIM records for your domain
- Use a reputable email service (SendGrid, Mailgun, etc.)
- Check email content (avoid spam trigger words)

### Rate limiting
- Supabase's default email service has low rate limits
- Configure custom SMTP for production use
- Consider using a dedicated email service

