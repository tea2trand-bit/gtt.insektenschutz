// Cookie consent
(function(){
  var banner = document.getElementById('cookieBanner');
  var acceptBtn = document.getElementById('cookieAccept');
  var declineBtn = document.getElementById('cookieDecline');
  if(!banner) return;

  var consent = localStorage.getItem('gtt_cookie_consent');
  if(!consent){
    banner.classList.add('active');
    banner.setAttribute('aria-hidden','false');
  }

  function closeBanner(value){
    localStorage.setItem('gtt_cookie_consent', value);
    banner.classList.remove('active');
    banner.setAttribute('aria-hidden','true');
  }

  if(acceptBtn) acceptBtn.addEventListener('click', function(){
    closeBanner('all');
    window.dispatchEvent(new Event('gtt:analytics-consent'));
  });
  if(declineBtn) declineBtn.addEventListener('click', function(){ closeBanner('necessary'); });
})();

// Mobile hamburger menu (for legal pages)
(function(){
  var hamburger = document.getElementById('hamburger');
  var mobileMenu = document.getElementById('mobileMenu');
  var mobileMenuClose = document.getElementById('mobileMenuClose');
  var mobileMenuBackdrop = document.getElementById('mobileMenuBackdrop');
  if(!hamburger || !mobileMenu) return;

  function openMenu(){
    mobileMenu.classList.add('active');
    hamburger.classList.add('active');
    mobileMenu.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu(){
    mobileMenu.classList.remove('active');
    hamburger.classList.remove('active');
    mobileMenu.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function(){
    if(mobileMenu.classList.contains('active')) closeMenu();
    else openMenu();
  });
  if(mobileMenuClose) mobileMenuClose.addEventListener('click', closeMenu);
  if(mobileMenuBackdrop) mobileMenuBackdrop.addEventListener('click', closeMenu);

  mobileMenu.querySelectorAll('[data-close-menu]').forEach(function(link){
    link.addEventListener('click', closeMenu);
  });
})();
