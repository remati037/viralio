# SEO Configuration for Viralio

This document outlines the SEO optimization implemented for Viralio.

## Overview

Viralio has been optimized for Google Search and other search engines with comprehensive metadata, structured data, and SEO best practices.

## Implemented Features

### 1. Meta Tags
- **Title Tags**: Dynamic titles with template support
- **Meta Descriptions**: Unique descriptions for each page
- **Keywords**: Relevant keywords for content planning and viral content
- **Language**: Set to Serbian (sr) for proper localization

### 2. Open Graph Tags
- Full Open Graph implementation for social media sharing
- Optimized images and descriptions
- Proper locale settings (sr_RS)

### 3. Twitter Cards
- Summary large image cards
- Optimized for Twitter sharing

### 4. Structured Data (JSON-LD)
- WebApplication schema
- Aggregate ratings
- Pricing information
- Application category

### 5. Robots & Sitemap
- `robots.txt` configuration
- XML sitemap generation
- Proper indexing directives for public/private pages

### 6. Technical SEO
- Canonical URLs (via metadataBase)
- Mobile-friendly viewport settings
- Proper icon configuration
- Theme color for mobile browsers

## Environment Variables

Add to your `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

This is used for:
- Canonical URLs
- Open Graph URLs
- Sitemap URLs
- Structured data URLs

## Google Search Console Setup

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property (domain or URL prefix)
3. Verify ownership using one of these methods:
   - HTML file upload
   - HTML tag (add to `app/layout.tsx` metadata.verification.google)
   - Domain name provider
4. Submit your sitemap: `https://your-domain.com/sitemap.xml`

## Page-Specific Metadata

### Public Pages
- **Home/Login**: Optimized for discovery
- **Login Page**: No-index (private page)

### Private Pages (App)
- **Planner**: No-index (requires authentication)
- **Profile**: No-index (requires authentication)
- **Competitors**: No-index (requires authentication)
- **Case Study**: No-index (requires authentication)
- **Admin**: No-index (requires authentication)

## SEO Best Practices Implemented

✅ Semantic HTML structure
✅ Proper heading hierarchy
✅ Alt text for images (add to images)
✅ Mobile-responsive design
✅ Fast page load times
✅ Secure HTTPS
✅ Clean URLs
✅ Proper redirects
✅ Structured data
✅ Social media optimization

## Next Steps

1. **Add Google Search Console verification code** to `app/layout.tsx`:
   ```typescript
   verification: {
     google: 'your-verification-code',
   },
   ```

2. **Create high-quality content** for public pages

3. **Add alt text** to all images in the application

4. **Monitor performance** in Google Search Console

5. **Submit sitemap** after deployment

6. **Add more structured data** for specific content types (BlogPosting, Article, etc.)

## Monitoring

- Use Google Search Console to monitor:
  - Search performance
  - Indexing status
  - Mobile usability
  - Core Web Vitals
  - Security issues

- Use Google Analytics for:
  - Traffic sources
  - User behavior
  - Conversion tracking

