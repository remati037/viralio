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

## Configuring Email Templates for Invitation Flow

When using `inviteUserByEmail`, Supabase automatically sends invitation emails. However, to ensure the password creation flow works correctly, you may need to configure the email templates.

### Important Note:

**Supabase automatically includes the `type=invite` parameter** in invitation links when using `inviteUserByEmail`. However, if you're using custom email templates, you need to ensure the parameter is preserved.

### Step-by-Step Instructions:

1. **Go to Supabase Dashboard**:
   - Navigate to your project
   - Go to **Authentication** → **Email Templates**

2. **Edit the "Invite user" template**:
   - Find the **"Invite user"** template in the list
   - Click **Edit** or the template name

3. **Check/Update the confirmation link**:
   - The default Supabase template uses:
     ```
     {{ .ConfirmationURL }}
     ```
   - **If using a custom template**, ensure you preserve the type parameter:
     ```
     {{ .ConfirmationURL }}&type=invite
     ```
   - **Or construct it manually** (if needed):
     ```
     {{ .SiteURL }}/auth/callback?token={{ .TokenHash }}&type=invite
     ```
   - **Note**: When using `inviteUserByEmail`, Supabase automatically adds `type=invite` to the confirmation URL, so you typically don't need to modify this unless you're using a completely custom template.

4. **Save the template**:
   - Click **Save** to apply the changes

### Alternative: Using Default Supabase Behavior

If you're using Supabase's default email templates (recommended), the `type=invite` parameter is **automatically included** when:

- You use `inviteUserByEmail()` API method
- The email template is set to "Invite user" type

**No manual configuration needed** in this case!

### Alternative: Using URL Configuration

If you prefer to handle this at the URL configuration level:

1. **Go to Authentication** → **URL Configuration**
2. **Set the Site URL** to your application URL (e.g., `https://yourdomain.com`)
3. **Add Redirect URLs**:
   - Add: `https://yourdomain.com/auth/callback`
   - Add: `https://yourdomain.com/auth/set-password`

### Template Variables Available

Supabase provides these variables in email templates:

- `{{ .SiteURL }}` - Your site URL
- `{{ .ConfirmationURL }}` - Full confirmation URL with token
- `{{ .Token }}` - The confirmation token
- `{{ .TokenHash }}` - Hashed token
- `{{ .Email }}` - User's email address
- `{{ .RedirectTo }}` - Redirect URL after confirmation

### Example Invite User Email Template

If you're creating a custom template, here's an example:

**Subject:**

```
You've been invited to join {{ .SiteName }}
```

**Body (HTML or Plain Text):**

```html
<h2>Welcome!</h2>
<p>You've been invited to join {{ .SiteName }}.</p>
<p>Click the link below to set your password and activate your account:</p>
<p><a href="{{ .ConfirmationURL }}">Set Password</a></p>
<p>Or copy and paste this URL into your browser:</p>
<p>{{ .ConfirmationURL }}</p>
<p>This link will expire in 24 hours.</p>
```

**Note**: When using `inviteUserByEmail`, `{{ .ConfirmationURL }}` already includes `type=invite` automatically, so you don't need to add it manually.

### Verification

After configuring (if needed):

1. **Test the invitation flow**:
   - Create a test user via admin dashboard using `inviteUserByEmail`
   - Check the email that was sent
   - Verify the link includes `&type=invite` parameter (should be automatic)

2. **Check the callback URL**:
   - When user clicks the link, it should go to:
     ```
     https://yourdomain.com/auth/callback?code=...&type=invite
     ```
   - The callback will then redirect to:
     ```
     https://yourdomain.com/auth/set-password?code=...&type=invite
     ```

3. **If type parameter is missing**:
   - The callback route has fallback logic to detect invitations
   - It will check for password-related errors and redirect accordingly
   - However, having `type=invite` makes the detection more reliable

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
