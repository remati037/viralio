# PWA Setup Instructions

## Icons Required

The PWA requires icon files in the `public` folder:
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

### Creating Icons

You can create these icons using any image editor. The icons should:
- Be square (equal width and height)
- Have a transparent or solid background
- Represent your app's branding

### Quick Icon Generation

You can use online tools like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

Or create them manually and place them in the `public` folder.

## Service Worker

The service worker is located at `/public/sw.js` and will be automatically registered when the app loads.

## Manifest

The PWA manifest is located at `/public/manifest.json` and is automatically linked in the root layout.

## Testing PWA

1. Build the app: `npm run build`
2. Start the production server: `npm start`
3. Open in Chrome/Edge
4. Open DevTools > Application > Service Workers to verify registration
5. Use "Add to Home Screen" to test installation

