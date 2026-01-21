# Password Reset Configuration Guide

## Issue: Reset Password Link Not Working

If the password reset link from the email is not redirecting to the password reset form, follow these steps:

## Step 1: Configure Redirect URLs in Supabase

The redirect URL must be whitelisted in your Supabase project settings:

1. **Go to Supabase Dashboard**:
   - Navigate to your project
   - Go to **Authentication** → **URL Configuration**

2. **Add Redirect URLs**:
   - Add your callback URL: `https://yourdomain.com/auth/callback`
   - Add your set-password URL: `https://yourdomain.com/auth/set-password`
   - Add your root URL: `https://yourdomain.com` (Supabase may redirect here with hash parameters)
   - For local development: `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/set-password`, and `http://localhost:3000`

3. **Set Site URL**:
   - Set your Site URL to your production domain (e.g., `https://yourdomain.com`)
   - Or `http://localhost:3000` for local development

**Important**: Supabase's password reset emails use PKCE tokens that are verified server-side. When the user clicks the link, Supabase verifies the token and redirects to your `redirectTo` URL (or Site URL) with session tokens in the hash (e.g., `#access_token=...&refresh_token=...&type=recovery`). The `HashTokenHandler` component (now in the root layout) will catch these and redirect to the set-password page.

## Step 2: Configure Email Template (If Using SendGrid)

If you're using SendGrid or another email service that wraps links, you need to ensure query parameters are preserved:

1. **Go to Supabase Dashboard**:
   - Navigate to **Authentication** → **Email Templates**

2. **Edit "Reset Password" template**:
   - The template should use: `{{ .ConfirmationURL }}`
   - This automatically includes all necessary query parameters (`code`, `type=recovery`)

3. **If SendGrid is wrapping links**:
   - Check SendGrid settings to ensure query parameters are preserved
   - Or configure SendGrid to not wrap Supabase authentication links
   - You may need to use SendGrid's "Click Tracking" settings to preserve query strings

## Step 3: Verify the Flow

The password reset flow should work as follows:

1. **User requests reset**:
   - User enters email on `/forgot-password` page
   - System calls `supabase.auth.resetPasswordForEmail()` with `redirectTo: /auth/callback`

2. **Email sent**:
   - Supabase sends email with link to: `https://yourdomain.com/auth/callback?code=...&type=recovery`
   - If using SendGrid, the link may be wrapped but should preserve query parameters

3. **User clicks link**:
   - Link goes to `/auth/callback` with `code` and `type=recovery` parameters
   - Callback route exchanges code for session
   - Redirects to `/auth/set-password?type=recovery` (session already established)

4. **User sets password**:
   - SetPasswordForm detects existing session and `type=recovery`
   - User enters new password
   - Password is updated successfully

## Troubleshooting

### Link goes to SendGrid tracking URL but doesn't redirect

**Problem**: SendGrid wraps the link and breaks query parameters.

**Solution**:
1. Check SendGrid click tracking settings
2. Ensure query parameters are preserved in SendGrid's link wrapping
3. Or disable click tracking for password reset emails in SendGrid

### "Invalid or missing authentication parameters" error

**Problem**: The `code` or `type` parameter is missing from the URL.

**Possible causes**:
1. Redirect URL not whitelisted in Supabase
2. SendGrid stripping query parameters
3. Email template not using `{{ .ConfirmationURL }}`

**Solution**:
1. Verify redirect URLs are whitelisted in Supabase Dashboard
2. Check the actual URL in the email (right-click link → Copy link address)
3. Verify it includes `?code=...&type=recovery`
4. If parameters are missing, check SendGrid settings or email template

### Link redirects to login page

**Problem**: The code exchange is failing or the session isn't being created.

**Solution**:
1. Check Supabase logs for errors
2. Verify the code hasn't expired (reset links expire after 1 hour)
3. Ensure the redirect URL matches exactly what's whitelisted in Supabase

### Session not persisting after code exchange

**Problem**: Cookies aren't being set properly.

**Solution**:
1. Check browser console for cookie errors
2. Verify SameSite cookie settings
3. Ensure you're using the same domain (no subdomain mismatches)

## Testing

To test the password reset flow:

1. **Request a password reset**:
   ```bash
   # Go to /forgot-password
   # Enter your email
   # Check your email inbox
   ```

2. **Check the email link**:
   - Right-click the link → Copy link address
   - Verify it includes: `?code=...&type=recovery`
   - The domain should match your Site URL in Supabase

3. **Click the link**:
   - Should redirect to `/auth/callback?code=...&type=recovery`
   - Then automatically redirect to `/auth/set-password?type=recovery`
   - Should show the password reset form

4. **Set new password**:
   - Enter new password (min 6 characters)
   - Confirm password
   - Should redirect to `/planner` after success

## Current Implementation

The code uses:
- `redirectTo: /auth/callback` in ForgotPasswordForm
- Callback route handles code exchange and redirects to `/auth/set-password`
- SetPasswordForm handles both code-based and session-based flows

## Important Notes

- **Redirect URLs must be exact matches** in Supabase Dashboard (including protocol and trailing slashes)
- **Codes expire after 1 hour** - users need to request a new reset if expired
- **SendGrid link wrapping** can break query parameters - configure carefully
- **Email templates** should use `{{ .ConfirmationURL }}` to preserve all parameters
