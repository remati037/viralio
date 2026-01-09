'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function PWALoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if app is running as PWA (standalone mode)
    const isStandalone =
      (window.matchMedia('(display-mode: standalone)').matches) ||
      ((window.navigator as any).standalone === true) ||
      document.referrer.includes('android-app://');

    // Only show loading screen in standalone/PWA mode
    if (!isStandalone) {
      return;
    }

    setIsVisible(true);
    setProgress(5);

    let progressValue = 5;
    const minProgressIncrement = 1;
    const maxProgress = 95;
    const progressIntervals: NodeJS.Timeout[] = [];

    // Update progress with smooth animation
    const updateProgress = (targetProgress: number) => {
      // Clear any existing progress intervals
      progressIntervals.forEach(clearInterval);
      progressIntervals.length = 0;

      const interval = setInterval(() => {
        if (progressValue < targetProgress) {
          progressValue = Math.min(
            progressValue + minProgressIncrement,
            targetProgress
          );
          setProgress(progressValue);
        } else {
          clearInterval(interval);
          const index = progressIntervals.indexOf(interval);
          if (index > -1) {
            progressIntervals.splice(index, 1);
          }
        }
      }, 30);
      progressIntervals.push(interval);
    };

    // Track loading states
    const states = {
      domContentLoaded: false,
      windowLoaded: false,
      fontsLoaded: false,
      imagesLoaded: false,
      appReady: false,
    };

    const checkComplete = () => {
      // Calculate progress based on completed states
      let completedStates = 0;
      if (states.domContentLoaded) completedStates++;
      if (states.windowLoaded) completedStates++;
      if (states.fontsLoaded) completedStates++;
      if (states.imagesLoaded) completedStates++;
      if (states.appReady) completedStates++;

      const targetProgress = Math.min(15 + completedStates * 15, maxProgress);
      updateProgress(targetProgress);

      // Check if all states are complete
      if (
        states.domContentLoaded &&
        states.windowLoaded &&
        states.fontsLoaded &&
        states.imagesLoaded &&
        states.appReady
      ) {
        // Final check - wait for app to be responsive
        setTimeout(() => {
          // Check if critical elements are rendered
          const body = document.body;
          const hasContent = body && body.children.length > 0;

          if (hasContent) {
            // Ensure app is interactive
            requestAnimationFrame(() => {
              setProgress(100);
              // Fade out after reaching 100%
              setTimeout(() => {
                setIsVisible(false);
              }, 400);
            });
          }
        }, 300);
      }
    };

    // DOM Content Loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        states.domContentLoaded = true;
        checkComplete();
      });
    } else {
      states.domContentLoaded = true;
      updateProgress(30);
    }

    // Window Load
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        states.windowLoaded = true;
        checkComplete();
      });
    } else {
      states.windowLoaded = true;
      updateProgress(45);
    }

    // Fonts Loaded
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready
        .then(() => {
          states.fontsLoaded = true;
          checkComplete();
        })
        .catch(() => {
          // Fallback if fonts fail to load
          setTimeout(() => {
            states.fontsLoaded = true;
            checkComplete();
          }, 1000);
        });
    } else {
      // Fallback if Font Loading API not available
      setTimeout(() => {
        states.fontsLoaded = true;
        checkComplete();
      }, 800);
    }

    // Images Loaded
    const images = document.querySelectorAll('img');
    if (images.length === 0) {
      states.imagesLoaded = true;
    } else {
      let loadedImages = 0;
      const totalImages = images.length;

      const checkImages = () => {
        loadedImages++;
        if (loadedImages >= totalImages) {
          states.imagesLoaded = true;
          checkComplete();
        }
      };

      images.forEach((img) => {
        if (img.complete) {
          checkImages();
        } else {
          img.addEventListener('load', checkImages);
          img.addEventListener('error', checkImages); // Count errors as "loaded"
        }
      });

      // Timeout fallback for images
      setTimeout(() => {
        if (!states.imagesLoaded) {
          states.imagesLoaded = true;
          checkComplete();
        }
      }, 3000);
    }

    // App Ready (wait for React hydration and initial render)
    const checkAppReady = () => {
      // Check if main content is rendered (more than just the loading screen)
      // The loading screen is typically one of the first elements, so we check for multiple children
      const hasMainContent = document.body.children.length > 1;

      if (hasMainContent) {
        // Wait for React to be interactive and ensure app is responsive
        requestAnimationFrame(() => {
          // Double RAF to ensure layout is complete
          requestAnimationFrame(() => {
            setTimeout(() => {
              states.appReady = true;
              checkComplete();
            }, 300);
          });
        });
      } else {
        // Retry if not ready yet (up to 10 times = 1 second max)
        let retries = 0;
        const maxRetries = 10;
        const retryInterval = setInterval(() => {
          retries++;
          if (document.body.children.length > 1 || retries >= maxRetries) {
            clearInterval(retryInterval);
            states.appReady = true;
            checkComplete();
          }
        }, 100);
      }
    };

    // Start checking for app readiness after DOM is loaded
    if (document.readyState === 'complete') {
      setTimeout(checkAppReady, 200);
    } else {
      window.addEventListener('load', () => {
        setTimeout(checkAppReady, 200);
      });
    }

    // Fallback: Ensure loading screen disappears after max time
    const maxLoadTime = 8000; // 8 seconds max
    const fallbackTimeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
      }, 400);
    }, maxLoadTime);

    // Cleanup
    return () => {
      clearTimeout(fallbackTimeout);
      progressIntervals.forEach(clearInterval);
      progressIntervals.length = 0;
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0f172a] transition-opacity duration-300"
      style={{
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {/* App Icon */}
      <div className="mb-8 flex items-center justify-center">
        <div className="relative h-24 w-24 rounded-2xl bg-white/10 p-4 shadow-2xl backdrop-blur-sm">
          <Image
            src="/viralio-icon-512.png"
            alt="Viralio"
            width={96}
            height={96}
            className="h-full w-full object-contain"
            priority
            unoptimized
          />
        </div>
      </div>

      {/* App Name */}
      <h1 className="mb-12 text-3xl font-bold text-white">Viralio</h1>

      {/* Progress Bar Container */}
      <div className="w-full max-w-xs px-8">
        {/* Progress Bar */}
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
            style={{
              width: `${progress}%`,
              boxShadow: '0 0 20px rgba(37, 99, 235, 0.6)',
            }}
          />
        </div>

        {/* Percentage Text */}
        <div className="mt-4 text-center">
          <span className="text-2xl font-semibold text-white">{progress}%</span>
        </div>
      </div>

      {/* Loading Spinner */}
      <div className="mt-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-blue-500" />
      </div>
    </div>
  );
}
