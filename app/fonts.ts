import localFont from 'next/font/local';

/**
 * Satoshi font via next/font/local so fonts are bundled and served from
 * _next/static in production (avoids /fonts/ path and CORS issues).
 */
export const satoshi = localFont({
  src: [
    { path: '../public/fonts/Satoshi-Light.woff2', weight: '300', style: 'normal' },
    { path: '../public/fonts/Satoshi-Regular.woff2', weight: '400', style: 'normal' },
    { path: '../public/fonts/Satoshi-Medium.woff2', weight: '500', style: 'normal' },
    { path: '../public/fonts/Satoshi-Bold.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
});
