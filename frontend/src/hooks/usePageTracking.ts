'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { analyticsApi } from '@/lib/api';

export function usePageTracking() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track admin pages
    if (pathname.startsWith('/admin')) {
      return;
    }

    const trackPageView = async () => {
      try {
        await analyticsApi.track({
          page: pathname,
          referrer: document.referrer || undefined
        });
      } catch (error) {
        // Silently fail - don't break the user experience
        console.debug('Analytics tracking failed:', error);
      }
    };

    // Track page view after a short delay to ensure page is loaded
    const timer = setTimeout(trackPageView, 1000);

    return () => clearTimeout(timer);
  }, [pathname]);
}

export default usePageTracking;