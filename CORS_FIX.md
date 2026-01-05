# 🚨 Quick Fix: Sanity CORS Error

You're seeing CORS errors because `https://www.viralio.ai` is not allowed to access your Sanity API.

## Immediate Fix (5 minutes)

### Step 1: Open Sanity Manage
Go to: **https://www.sanity.io/manage**

### Step 2: Select Your Project
- Find your project (Project ID: `7d9ft76t`)
- Click on it

### Step 3: Navigate to CORS Settings
- Click **Settings** (gear icon) or find **API** section
- Look for **CORS origins** or **API** → **CORS origins**

### Step 4: Add Your Domain
1. Click **"Add CORS origin"** or **"+ Add origin"**
2. Enter: `https://www.viralio.ai`
3. ✅ **Check "Allow credentials"** (CRITICAL!)
4. Click **Save**

### Step 5: Add Additional Domains (Recommended)
Also add:
- `https://viralio.ai` (without www)
- `https://viralio-*.vercel.app` (for Vercel preview deployments)

### Step 6: Wait and Test
- Wait 1-2 minutes for changes to propagate
- Refresh your site at `https://www.viralio.ai`
- Check browser console - errors should be gone!

## Still Not Working?

1. **Verify the domain is exactly correct:**
   - Must start with `https://`
   - No trailing slash
   - Match exactly what's in your browser address bar

2. **Check "Allow credentials" is checked:**
   - This is required for authenticated requests

3. **Clear browser cache:**
   - Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)

4. **Check Sanity project ID:**
   - Make sure you're editing the correct project
   - Your project ID should be `7d9ft76t` (visible in the errors)

5. **Verify environment variables in Vercel:**
   - `NEXT_PUBLIC_SANITY_PROJECT_ID` should match your Sanity project ID
   - Redeploy after adding/changing env vars

## What the Error Looks Like

```
Access to XMLHttpRequest at 'https://7d9ft76t.api.sanity.io/...' 
from origin 'https://www.viralio.ai' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

This means Sanity doesn't know it's allowed to respond to requests from `www.viralio.ai`.

## After Fixing

Once CORS is configured:
- ✅ No more CORS errors in console
- ✅ Templates load successfully
- ✅ Case studies load successfully
- ✅ All Sanity data accessible from your domain

---

**Need more help?** See `VERCEL_DEPLOYMENT.md` for complete deployment guide.

