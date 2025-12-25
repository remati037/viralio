import type { Metadata } from "next";
import Script from "next/script";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Viralio",
  description: "Planirajte svoj kontent i postanite viralni",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ViralVault" />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
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
                window.addEventListener('load', () => {
                  // Small delay to ensure page is fully loaded
                  setTimeout(() => {
                    navigator.serviceWorker.register('/sw.js', { scope: '/' })
                      .then((registration) => {
                        console.log('SW registered: ', registration.scope);
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
                  }, 1000);
                });
              }
            }
          `}
        </Script>
      </body>
    </html>
  );
}

