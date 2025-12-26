import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://viralio.com'
const siteName = 'Viralio'
const defaultTitle = 'Viralio'
const defaultDescription = 'Viralio je platforma za planiranje i upravljanje viralnim kontentom. Kreirajte ideje, organizujte zadatke, pratite rezultate i postanite viralni sa našim AI asistentom za generisanje kontenta.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  keywords: [
    'viralio',
    'viralni kontent',
    'planiranje kontenta',
    'content planning',
    'social media marketing',
    'content management',
    'AI content generator',
    'viral content',
    'content strategy',
    'marketing tools',
    'content calendar',
    'kanban board',
    'content ideje',
  ],
  authors: [{ name: 'Viralio' }],
  creator: 'Viralio',
  publisher: 'Viralio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  colorScheme: 'dark',
  icons: {
    icon: [
      { url: "/viralio-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/viralio-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/viralio-icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Viralio",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  openGraph: {
    type: 'website',
    locale: 'sr_RS',
    url: siteUrl,
    siteName: siteName,
    title: `${defaultTitle} - Planirajte svoj kontent i postanite viralni`,
    description: defaultDescription,
    images: [
      {
        url: `${siteUrl}/viralio-icon-512.png`,
        width: 512,
        height: 512,
        alt: 'Viralio Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${defaultTitle} - Planirajte svoj kontent i postanite viralni`,
    description: defaultDescription,
    images: [`${siteUrl}/viralio-icon-512.png`],
    creator: '@viralio',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification code here when available
    // google: 'your-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/viralio-icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/viralio-icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Viralio" />
        <meta name="application-name" content="Viralio" />
        <meta name="msapplication-TileColor" content="#2563eb" />
        <meta name="msapplication-TileImage" content="/viralio-icon-192.png" />
        {/* Preload critical resources for faster PWA startup */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preload" href="/viralio-icon-192.png" as="image" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Viralio',
              description: defaultDescription,
              url: siteUrl,
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.8',
                ratingCount: '150',
              },
            }),
          }}
        />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#e2e8f0',
            },
          }}
        />
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator && typeof window !== 'undefined') {
              // Only register service worker on HTTPS or localhost
              const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
              
              if (isSecureContext) {
                // Register immediately without delay for faster PWA startup
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                  .then((registration) => {
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker available, but don't auto-reload on mobile
                            console.log('New service worker available');
                          }
                        });
                      }
                    });
                  })
                  .catch((registrationError) => {
                    // Silently fail - app should work without service worker
                    console.warn('SW registration failed (app will work normally): ', registrationError);
                  });
              }
            }
          `}
        </Script>
      </body>
    </html>
  );
}

