# Sanity CMS Setup

This project uses Sanity CMS for managing Templates (Šabloni) and Case Studies (Studije slučaja).

## Setup Instructions

### 1. Create a Sanity Account and Project

1. Go to [sanity.io](https://www.sanity.io/) and create a free account
2. Create a new project
3. Note down your Project ID and Dataset name (usually "production")

### 2. Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Sanity CMS Configuration
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your_api_token_here
```

### 3. Get Your Sanity API Token

1. Go to your Sanity project dashboard
2. Navigate to **API** > **Tokens**
3. Click **Add API token**
4. Name it (e.g., "Next.js Production")
5. Select **Editor** permissions (or **Admin** for full access)
6. Copy the token and add it to `.env.local` as `SANITY_API_TOKEN`

### 4. Deploy Sanity Studio to Sanity.io

To deploy your Sanity Studio so you can access it on the web:

```bash
npx sanity deploy
```

This will:

1. Ask you to authenticate with Sanity (if not already logged in)
2. Prompt you to create a studio hostname (e.g., `viralio-cms`)
3. Deploy your studio to `https://your-studio-name.sanity.studio`

**Alternative: Use Sanity.io Manage**

You can also access your Sanity Studio directly through the Sanity website:

1. Go to [sanity.io/manage](https://www.sanity.io/manage)
2. Sign in with your Sanity account
3. Select your project
4. Click "Open Studio" to access the content editor

### 5. Access Sanity Studio

Once deployed, you can access Sanity Studio at:

**Via Sanity.io:**

- URL: `https://www.sanity.io/manage` (then select your project)
- Or your deployed studio URL: `https://your-studio-name.sanity.studio`

**Note:** The studio is hosted on Sanity.io, not embedded in your Next.js app.

## Content Types

### Templates (Šabloni)

Templates represent reusable content templates for creating viral content. Fields include:

- **Naslov** (Title) - Required
- **Format** - Short or Long form (radio button selection)
- **Niša** (Niche) - Marketing, Real Estate, Fitness, E-commerce
- **Potencijal pregleda** (Views Potential) - Low to Viral
- **Koncept** (Concept) - Explanation of why it works
- **Struktura** (Structure) - Conditional based on format:
  - **Kratka Forma**: Hook, Body, CTA
  - **Duga Forma**: Body only

### Case Studies (Studije slučaja)

Case studies showcase successful content examples. Fields include:

- **Naslov** (Title) - Required
- **Niša** (Niche) - Marketing, Real Estate, Fitness, E-commerce
- **Format** - Short or Long form
- **Hook, Body, CTA** - Content structure
- **Analiza** (Analysis) - Rich text analysis of why it worked
- **Rezultati** (Results) - Views, Engagement, Conversions
- **Naslovna slika** (Cover Image) - URL to cover image
- **Datum objave** (Publish Date)

## Syncing Content to Supabase

After creating or editing content in Sanity Studio:

1. Go to Admin Dashboard > Sanity CMS tab
2. Click **"Sinhronizuj Šablone"** to sync templates
3. Click **"Sinhronizuj Studije Slučaja"** to sync case studies

The sync process will:

- Create new items in Supabase if they don't exist
- Update existing items if they already exist
- Handle template visibility settings

## Schema Files

The Sanity schemas are located in:

- `sanity/schemas/template.ts` - Template schema
- `sanity/schemas/caseStudy.ts` - Case Study schema

## API Routes

Sync routes are available at:

- `/api/sanity/sync-templates` - Sync templates from Sanity to Supabase
- `/api/sanity/sync-case-studies` - Sync case studies from Sanity to Supabase

Both routes require admin authentication.

## Troubleshooting

### "Project ID not configured"

- Make sure `NEXT_PUBLIC_SANITY_PROJECT_ID` is set in `.env.local`
- Restart your development server after adding environment variables

### Can't access Sanity Studio

- Make sure you've deployed the studio with `npx sanity deploy`
- Or access it via [sanity.io/manage](https://www.sanity.io/manage)
- Verify you're logged in with the correct Sanity account

### "Unauthorized" error when syncing

- Check that you're logged in as an admin user in your Next.js app
- Verify your `SANITY_API_TOKEN` is correct and has Editor/Admin permissions

### Sync fails

- Ensure you're logged in as an admin in your Next.js app
- Check browser console for detailed error messages
- Verify that all required fields are filled in Sanity Studio
- Make sure your `SANITY_API_TOKEN` has read permissions for your dataset

## Useful Commands

```bash
# Deploy Sanity Studio to Sanity.io
npx sanity deploy

# Login to Sanity CLI
npx sanity login

# Validate schemas
npx sanity schema validate

# Start local Sanity Studio (for development)
npx sanity dev

# Install Sanity CLI globally (optional)
npm install -g @sanity/cli
```

**Note:** The studio is hosted on Sanity.io. You don't need to run a local studio server unless you're developing custom studio components.
