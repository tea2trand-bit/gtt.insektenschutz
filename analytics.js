// Google Analytics is loaded only after the visitor accepts analytics cookies.
(function () {
  var measurementId = 'G-LE1EST3PP2';
  var loaded = false;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', { analytics_storage: 'denied' });

  window.gttTrack = function (eventName, parameters) {
    if (window.localStorage.getItem('gtt_cookie_consent') !== 'all') return;
    window.gtag('event', eventName, parameters || {});
  };

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

  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href') || '';
    var explicitEvent = link.getAttribute('data-track');
    var eventName = explicitEvent;

    if (!eventName && href.indexOf('tel:') === 0) eventName = 'phone_click';
    if (!eventName && href.indexOf('mailto:') === 0) eventName = 'email_click';
    if (!eventName && href.indexOf('wa.me/') !== -1) eventName = 'whatsapp_click';
    if (!eventName) return;

    window.gttTrack(eventName, {
      link_url: link.href,
      link_text: (link.textContent || '').trim().slice(0, 120)
    });
  });
})();
