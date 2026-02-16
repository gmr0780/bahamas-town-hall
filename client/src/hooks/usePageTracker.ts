import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTracker() {
  const location = useLocation();

  useEffect(() => {
    // Don't track admin pages
    if (location.pathname.startsWith('/admin')) return;

    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: location.pathname,
        referrer: document.referrer || undefined,
      }),
    }).catch(() => {});
  }, [location.pathname]);
}
