# Admin User Management Setup

## Service Role Key - Required for Admin Features

The admin user management features (create, update, delete users) require the `SUPABASE_SERVICE_ROLE_KEY` to function properly.

## Where to Find the Service Role Key

1. **Log in to Supabase Dashboard**: Go to [supabase.com](https://supabase.com) and sign in
2. **Select Your Project**: Choose the project you're working with
3. **Navigate to Settings**: Click on the gear icon (⚙️) in the left sidebar
4. **Go to API Settings**: Click on **"API"** in the settings menu
5. **Find Service Role Key**: Scroll down to the **"Project API keys"** section
   - You'll see two keys:
     - `anon` / `public` key (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
     - `service_role` key (this is your `SUPABASE_SERVICE_ROLE_KEY`) ⚠️ **Keep this secret!**
6. **Copy the Service Role Key**: Click the eye icon to reveal it, then copy it

## Why Do We Need It?

The Service Role Key is required because:

1. **Creating Users**: We need to create users in Supabase Auth, which requires admin privileges
2. **Sending Verification Emails**: Supabase automatically sends verification emails when creating users
3. **Bypassing RLS**: Admin operations need to bypass Row Level Security to manage all users
4. **Deleting Users**: Removing users from the auth system requires admin access

## Can We Make It Work Without It?

**Short answer: No, not for full functionality.**

However, here are the limitations if you don't use the service role key:

### ❌ What Won't Work Without Service Role Key:
- **Creating new users** - Cannot create users in Supabase Auth
- **Sending verification emails** - Cannot trigger email verification
- **Deleting users** - Cannot remove users from auth system
- **Updating user emails/passwords** - Cannot modify auth user data

### ✅ What Could Work (with modifications):
- **Viewing users** - Already works with RLS policies
- **Updating profile data** - Could work with RLS if admin policies are set up
- **Changing tiers** - Could work with RLS policies

### Alternative Approach (Not Recommended)

If you absolutely cannot use the service role key, you could:

1. **Use Supabase Dashboard**: Manually create users through the Supabase dashboard
2. **Use Database Functions**: Create PostgreSQL functions with `SECURITY DEFINER` that run with elevated privileges
3. **Use Supabase CLI**: Create users via command line (still requires service role key)

However, these approaches are:
- Less user-friendly
- Require manual intervention
- Don't integrate with your admin UI
- May not support all features (like email verification)

## Security Best Practices

✅ **DO:**
- Store the service role key in `.env.local` (already in `.gitignore`)
- Only use it in server-side API routes (never expose to client)
- Use environment variables in production (Vercel, etc.)
- Rotate the key if it's ever exposed

❌ **DON'T:**
- Commit the service role key to git
- Expose it in client-side code
- Share it publicly
- Use it in browser/client components

## Current Implementation

Our implementation already follows security best practices:

- ✅ Service role key is only used in server-side API routes (`/app/api/admin/users/*`)
- ✅ All routes check if the current user is an admin before allowing operations
- ✅ The key is never exposed to the client
- ✅ Environment variable is properly configured

## Setup Steps

1. **Get your Service Role Key** (see instructions above)
2. **Add to `.env.local`**:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
3. **Restart your development server**:
   ```bash
   npm run dev
   ```
4. **Test the feature**: Try creating a user from the Admin Dashboard

## Troubleshooting

### Error: "SUPABASE_SERVICE_ROLE_KEY is not set"
- Make sure you've added the key to `.env.local`
- Restart your development server after adding it
- Check that the variable name is exactly `SUPABASE_SERVICE_ROLE_KEY`

### Error: "Invalid API key"
- Verify you copied the entire key (it's very long)
- Make sure there are no extra spaces or quotes
- Check that you're using the `service_role` key, not the `anon` key

### Users not receiving verification emails
- Check Supabase Dashboard > Authentication > Email Templates
- Verify your email provider is configured
- Check Supabase logs for email sending errors

