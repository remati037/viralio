# Vercel Deployment Guide for Sanity CMS

This guide will help you configure Sanity CMS to work correctly on your Vercel deployment.

## Common Issues

If Sanity works locally but not on Vercel, it's usually due to:

1. **Missing Environment Variables** - Most common issue
2. **CORS Configuration** - Sanity needs to allow your Vercel domain
3. **Environment Variable Prefix** - `NEXT_PUBLIC_` variables must be set correctly

## Step 1: Configure Environment Variables in Vercel

### Required Environment Variables

Go to your Vercel project dashboard and add these environment variables:

1. **Navigate to**: Your Project → Settings → Environment Variables

2. **Add the following variables**:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_sanity_project_id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_sanity_api_token
```

### Important Notes:

- **`NEXT_PUBLIC_*` prefix is required** for client-side access
- **`SANITY_API_TOKEN`** is used for server-side operations (API routes)
- Make sure to set these for **Production**, **Preview**, and **Development** environments
- After adding variables, **redeploy your application**

### How to Find Your Sanity Credentials:

1. **Project ID & Dataset**:
   - Go to [sanity.io/manage](https://www.sanity.io/manage)
   - Select your project
   - Go to **API** → **Project settings**
   - Copy the **Project ID** and **Dataset** name

2. **API Token**:
   - In the same **API** section
   - Go to **Tokens**
   - Click **Add API token**
   - Name it (e.g., "Vercel Production")
   - Select **Editor** or **Admin** permissions
   - Copy the token

## Step 2: Configure CORS in Sanity ⚠️ CRITICAL

**This is the most common issue!** Sanity needs to allow requests from your production domain.

### Quick Fix for CORS Errors:

If you're seeing errors like:
- `Access-Control-Allow-Origin header is not present`
- `blocked by CORS policy`
- `403 Forbidden` errors from Sanity API

Follow these steps:

1. **Go to Sanity Manage:**
   - Visit [https://www.sanity.io/manage](https://www.sanity.io/manage)
   - Sign in with your Sanity account
   - Select your project (Project ID: `7d9ft76t` or your project ID)

2. **Navigate to CORS Settings:**
   - Click on your project
   - Go to **Settings** (gear icon) or **API** section
   - Find **CORS origins** or **API** → **CORS origins**

3. **Add Your Production Domain:**
   - Click **Add CORS origin** or **+ Add origin**
   - Enter your domain: `https://www.viralio.ai`
   - ✅ **Check "Allow credentials"** (IMPORTANT!)
   - Click **Save**

4. **Add Additional Domains (if needed):**
   - `https://viralio.ai` (without www)
   - Your Vercel preview URLs: `https://viralio-*.vercel.app` (wildcard)
   - Any custom domains you use

5. **Wait and Test:**
   - CORS changes can take 1-2 minutes to propagate
   - Refresh your production site
   - Check browser console - CORS errors should be gone

### Visual Guide:

```
Sanity Dashboard → Your Project → Settings → API → CORS origins
                                                      ↓
                                    [Add CORS origin]
                                                      ↓
                                    Origin: https://www.viralio.ai
                                    ✅ Allow credentials
                                                      ↓
                                              [Save]
```

### Common Mistakes:

❌ **Don't forget the `https://` prefix**
❌ **Don't forget to check "Allow credentials"**
❌ **Don't add `http://` for production (only use HTTPS)**
✅ **Do add both `www.viralio.ai` and `viralio.ai` if you use both**
✅ **Do wait a few minutes after saving before testing**

## Step 3: Verify Configuration

### Check Environment Variables:

1. In Vercel, go to your deployment
2. Click on the deployment
3. Check the **Build Logs** for any Sanity-related errors
4. Look for the log message: `🔧 Sanity Server Client Config:` (should show your project ID)

### Test Sanity Connection:

1. Deploy your app
2. Open browser console on your live site
3. Check for any Sanity-related errors
4. Try accessing a page that uses Sanity (e.g., templates or case studies)

## Step 4: Troubleshooting

### Error: "NEXT_PUBLIC_SANITY_PROJECT_ID is not set"

**Solution:**
- Verify the environment variable is set in Vercel
- Make sure it has the `NEXT_PUBLIC_` prefix
- Redeploy after adding the variable

### Error: "Project not found" or "Unauthorized"

**Solution:**
- Verify your `NEXT_PUBLIC_SANITY_PROJECT_ID` is correct
- Check that your `SANITY_API_TOKEN` has the correct permissions
- Ensure the token hasn't expired

### Error: CORS error in browser console

**Solution:**
- Add your Vercel domain to Sanity CORS origins (Step 2)
- Make sure you're using `https://` (not `http://`)
- Include both production and preview domains

### Sanity works locally but not on Vercel

**Checklist:**
- ✅ Environment variables are set in Vercel (not just `.env.local`)
- ✅ Variables have correct `NEXT_PUBLIC_` prefix
- ✅ CORS is configured in Sanity for your Vercel domain
- ✅ You've redeployed after adding environment variables
- ✅ Check Vercel build logs for errors

### Environment Variables Not Updating

**Solution:**
- After adding/changing environment variables in Vercel, you **must redeploy**
- Vercel doesn't automatically redeploy when env vars change
- Go to **Deployments** → Click **...** → **Redeploy**

## Step 5: Verify Deployment

After configuration:

1. **Redeploy your application** in Vercel
2. **Check the build logs** for Sanity configuration messages
3. **Test on your live domain**:
   - Try accessing templates/case studies
   - Check browser console for errors
   - Verify API routes work (if using sync functionality)

## Quick Reference

### Environment Variables Checklist:

```env
# Required for client-side Sanity access
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id

# Optional (defaults to 'production')
NEXT_PUBLIC_SANITY_DATASET=production

# Required for server-side API routes
SANITY_API_TOKEN=your_api_token
```

### Sanity CORS Origins:

```
https://your-app.vercel.app
https://your-app-*.vercel.app
https://yourdomain.com (if using custom domain)
```

## Still Having Issues?

1. **Check Vercel Function Logs**:
   - Go to Vercel Dashboard → Your Project → Functions
   - Check for any Sanity-related errors

2. **Check Browser Console**:
   - Open your live site
   - Open Developer Tools → Console
   - Look for Sanity error messages

3. **Verify Sanity Project**:
   - Make sure your Sanity project is active
   - Check that you have content published
   - Verify dataset name matches your configuration

4. **Test API Routes**:
   - Try accessing `/api/sanity/sync-templates` (requires admin auth)
   - Check network tab for API responses

## Additional Resources

- [Sanity Documentation](https://www.sanity.io/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

