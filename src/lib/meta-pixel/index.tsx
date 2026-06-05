import { useEffect } from 'react';

const PIXEL_ID = '971652248979019';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export const initMetaPixel = () => {
  if (typeof window === 'undefined') return;

  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', PIXEL_ID);
  window.fbq('track', 'PageView');
};

export const trackPixelEvent = (eventName: string, params?: object) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, params);
  }
};

export const useMetaPixel = () => {
  useEffect(() => {
    initMetaPixel();
  }, []);
};
