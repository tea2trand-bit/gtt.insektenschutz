// Google Analytics is loaded only after the visitor accepts analytics cookies.
(function () {
  var measurementId = 'G-LE1EST3PP2';
  var loaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', { analytics_storage: 'denied' });

  function startAnalytics() {
    if (loaded) return;
    loaded = true;
    window.gtag('consent', 'update', { analytics_storage: 'granted' });

    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    script.onload = function () {
      window.gtag('js', new Date());
      window.gtag('config', measurementId);
    };
    document.head.appendChild(script);
  }

  if (window.localStorage.getItem('gtt_cookie_consent') === 'all') {
    startAnalytics();
  }

  window.addEventListener('gtt:analytics-consent', startAnalytics);
})();
