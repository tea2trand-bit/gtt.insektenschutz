(function () {
  var banner = document.getElementById('cookieBanner');
  var acceptBtn = document.getElementById('cookieAccept');
  var declineBtn = document.getElementById('cookieDecline');
  if (!banner) return;

  if (!localStorage.getItem('gtt_cookie_consent')) {
    banner.classList.add('active');
    banner.setAttribute('aria-hidden', 'false');
  }

  function closeBanner(value) {
    localStorage.setItem('gtt_cookie_consent', value);
    banner.classList.remove('active');
    banner.setAttribute('aria-hidden', 'true');
  }

  if (acceptBtn) acceptBtn.addEventListener('click', function () {
    closeBanner('all');
    window.dispatchEvent(new Event('gtt:analytics-consent'));
  });
  if (declineBtn) declineBtn.addEventListener('click', function () {
    closeBanner('necessary');
  });
})();
