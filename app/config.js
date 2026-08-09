// API endpoint. When the UI is served by the backend itself (office browser or
// https://elishenagrivance.com through the Cloudflare tunnel) it just talks to
// its own origin. The installed apps (Electron file://, Capacitor native) carry
// their own UI, so they default to the public domain — overridable per device
// via the login screen's "Change" button (stored in localStorage).
(function () {
  const saved = localStorage.getItem('api_base');
  const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform
    && window.Capacitor.isNativePlatform());
  const servedByBackend = !isNative && /^https?:$/.test(location.protocol);
  window.API_BASE = saved
    || (servedByBackend ? location.origin : 'https://elishenagrivance.com');
})();
