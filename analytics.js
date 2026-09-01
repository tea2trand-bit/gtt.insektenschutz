// Consent-aware GA4 reporting for visitor and conversion events.
(function () {
  'use strict';

  var measurementId = 'G-LE1EST3PP2';
  var consentKey = 'gtt_cookie_consent';
  var oncePrefix = 'gtt_analytics_once:';
  var loaded = false;
  var memoryOnce = {};

  var primaryEvents = {
    generate_lead: true,
    calculator_lead_submitted: true,
    contact_form_submitted: true,
    whatsapp_click: true,
    phone_click: true,
    email_click: true,
    thank_you_viewed: true
  };


  // First-touch lead attribution is stored only for the current browser tab.
  // It is submitted with a form so each Netlify lead carries its own source.
  var attributionKey = 'gtt_lead_attribution_v1';
  var attributionFieldNames = {
    source: 'lead_source',
    medium: 'lead_medium',
    campaign: 'lead_campaign',
    landingPage: 'lead_landing_page',
    referrer: 'lead_referrer',
    capturedAt: 'lead_captured_at',
    clickIdPresent: 'lead_click_id_present'
  };

  function attributionValue(value, maxLength) {
    return String(value || '')
      .replace(/[\\u0000-\\u001f\\u007f]/g, ' ')
      .trim()
      .slice(0, maxLength || 160);
  }

  function referrerLabel(rawReferrer) {
    if (!rawReferrer) return '(none)';
    try {
      var referrerUrl = new URL(rawReferrer);
      return attributionValue(referrerUrl.hostname.replace(/^www\\./, '') + referrerUrl.pathname, 240);
    } catch (_error) {
      return '(unavailable)';
    }
  }

  function sourceFromReferrer(rawReferrer) {
    if (!rawReferrer) return { source: 'direct', medium: 'none' };

    try {
      var hostname = new URL(rawReferrer).hostname.toLowerCase().replace(/^www\\./, '');
      var currentHostname = window.location.hostname.toLowerCase().replace(/^www\\./, '');
      if (hostname === currentHostname) return { source: 'internal', medium: 'navigation' };
      if (/(^|\\.)google\\./.test(hostname)) return { source: 'google', medium: 'organic' };
      if (hostname === 'bing.com' || hostname.endsWith('.bing.com')) return { source: 'bing', medium: 'organic' };
      if (hostname === 'duckduckgo.com') return { source: 'duckduckgo', medium: 'organic' };
      if (/(^|\\.)search\\.yahoo\\./.test(hostname)) return { source: 'yahoo', medium: 'organic' };
      if (hostname === 'facebook.com' || hostname.endsWith('.facebook.com')) return { source: 'facebook', medium: 'social' };
      if (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) return { source: 'instagram', medium: 'social' };
      if (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')) return { source: 'linkedin', medium: 'social' };
      return { source: attributionValue(hostname, 100), medium: 'referral' };
    } catch (_error) {
      return { source: 'unknown', medium: 'referral' };
    }
  }

  function createLeadAttribution() {
    var params = new URLSearchParams(window.location.search || '');
    var sourceAndMedium = sourceFromReferrer(document.referrer);
    var clickIdPresent = 'no';

    if (params.get('utm_source')) {
      sourceAndMedium.source = attributionValue(params.get('utm_source'), 100);
      sourceAndMedium.medium = attributionValue(params.get('utm_medium') || 'campaign', 100);
    } else if (params.get('gclid')) {
      sourceAndMedium = { source: 'google', medium: 'cpc' };
      clickIdPresent = 'yes';
    } else if (params.get('msclkid')) {
      sourceAndMedium = { source: 'bing', medium: 'cpc' };
      clickIdPresent = 'yes';
    } else if (params.get('fbclid')) {
      sourceAndMedium = { source: 'facebook', medium: 'paid_social' };
      clickIdPresent = 'yes';
    }

    if (params.get('gclid') || params.get('msclkid') || params.get('fbclid')) {
      clickIdPresent = 'yes';
    }

    return {
      source: sourceAndMedium.source,
      medium: sourceAndMedium.medium,
      campaign: attributionValue(params.get('utm_campaign') || '(none)', 140),
      landingPage: attributionValue(window.location.pathname || '/', 200),
      referrer: referrerLabel(document.referrer),
      capturedAt: new Date().toISOString(),
      clickIdPresent: clickIdPresent
    };
  }

  function getLeadAttribution() {
    try {
      var stored = window.sessionStorage.getItem(attributionKey);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && parsed.source && parsed.capturedAt) return parsed;
      }

      var created = createLeadAttribution();
      window.sessionStorage.setItem(attributionKey, JSON.stringify(created));
      return created;
    } catch (_error) {
      return createLeadAttribution();
    }
  }

  var leadAttribution = getLeadAttribution();

  window.gttPopulateLeadAttribution = function (form) {
    if (!form || !form.querySelector) return;
    Object.keys(attributionFieldNames).forEach(function (key) {
      var field = form.querySelector('[name="' + attributionFieldNames[key] + '"]');
      if (field) field.value = attributionValue(leadAttribution[key], 240);
    });
    form.setAttribute('data-attribution-ready', 'true');
  };

  function populateLeadForms() {
    document.querySelectorAll('form[name="angebot"], form[name="kontakt"], form[name="b2b-anfrage"]').forEach(function (form) {
      window.gttPopulateLeadAttribution(form);
    });
  }

  document.addEventListener('submit', function (event) {
    window.gttPopulateLeadAttribution(event.target);
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', populateLeadForms, { once: true });
  } else {
    populateLeadForms();
  }

  var allowedParameters = {
    analytics_version: true,
    contact_channel: true,
    conversion_tier: true,
    form_type: true,
    form_name: true,
    lead_type: true,
    interaction_location: true,
    transport_type: true,
    video_id: true
  };

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', { analytics_storage: 'denied' });

  function hasConsent() {
    try {
      return window.localStorage.getItem(consentKey) === 'all';
    } catch (_error) {
      return false;
    }
  }

  function cleanValue(value) {
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    return String(value || '').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 100);
  }

  function cleanParameters(parameters) {
    var cleaned = {};
    Object.keys(parameters || {}).forEach(function (key) {
      if (!allowedParameters[key]) return;
      cleaned[key] = cleanValue(parameters[key]);
    });
    return cleaned;
  }

  function wasTracked(key) {
    if (!key) return false;
    if (memoryOnce[key]) return true;

    try {
      if (window.sessionStorage.getItem(oncePrefix + key) === '1') return true;
      window.sessionStorage.setItem(oncePrefix + key, '1');
    } catch (_error) {
      memoryOnce[key] = true;
    }
    return false;
  }

  window.gttTrack = function (eventName, parameters, onceKey) {
    if (!hasConsent()) return false;
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(eventName || '')) return false;
    if (wasTracked(onceKey)) return false;

    var payload = cleanParameters(parameters);
    payload.analytics_version = 'conversion_v1';
    payload.conversion_tier = primaryEvents[eventName] ? 'primary' : 'micro';
    window.gtag('event', eventName, payload);
    return true;
  };

  function startAnalytics() {
    if (loaded || !hasConsent()) return;
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

  function interactionLocation(element) {
    if (!element || !element.closest) return 'page';
    var section = element.closest('section[id], header, footer, aside[id], main');
    if (!section) return 'page';
    if (section.id) return cleanValue(section.id);
    return cleanValue(section.tagName.toLowerCase());
  }

  function formName(form) {
    if (!form) return '';
    var hiddenName = form.querySelector('input[name="form-name"]');
    return cleanValue(form.getAttribute('name') || (hiddenName && hiddenName.value) || '');
  }

  function markCalculatorStarted(target) {
    if (!target || !target.closest || !target.closest('#rechner')) return;
    window.gttTrack('calculator_started', {
      interaction_location: 'rechner'
    }, 'calculator_started');
  }

  function priceIsVisible(priceElement) {
    if (!priceElement || priceElement.hidden) return false;
    var style = window.getComputedStyle(priceElement);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    return /CHF\s*[0-9]/i.test(priceElement.textContent || '');
  }

  function watchPriceReveal() {
    var priceElement = document.getElementById('priceReveal');
    if (!priceElement) return;

    var reportPrice = function () {
      if (!priceIsVisible(priceElement)) return;
      window.gttTrack('price_revealed', {
        interaction_location: 'rechner'
      }, 'price_revealed');
    };

    reportPrice();
    new MutationObserver(reportPrice).observe(priceElement, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    });
    window.addEventListener('gtt:analytics-consent', reportPrice);
  }

  function videoId(video) {
    var source = video.currentSrc || video.getAttribute('src') || '';
    if (!source) {
      var sourceElement = video.querySelector('source[src]');
      source = sourceElement ? sourceElement.getAttribute('src') : '';
    }

    try {
      source = new URL(source, window.location.href).pathname;
    } catch (_error) {
      source = String(source || '');
    }

    var fileName = source.split('/').pop() || 'video';
    return cleanValue(fileName.replace(/\.[^.]+$/, '')) || 'video';
  }

  function reportThankYou() {
    if (!/(^|\/)danke(?:\.html)?\/?$/i.test(window.location.pathname)) return;
    window.gttTrack('thank_you_viewed', {
      interaction_location: 'thanks_page'
    }, 'thank_you_viewed');
  }

  if (hasConsent()) startAnalytics();

  window.addEventListener('gtt:analytics-consent', function () {
    startAnalytics();
    reportThankYou();
  });

  document.addEventListener('input', function (event) {
    markCalculatorStarted(event.target);
  });

  document.addEventListener('change', function (event) {
    markCalculatorStarted(event.target);
  });

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;

    var stepper = target.closest('#rechner .stepper-btn');
    if (stepper) markCalculatorStarted(stepper);

    var link = target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href') || '';
    var eventName = cleanValue(link.getAttribute('data-track') || '');
    var channel = '';

    if (!eventName && href.indexOf('tel:') === 0) {
      eventName = 'phone_click';
      channel = 'phone';
    }
    if (!eventName && href.indexOf('mailto:') === 0) {
      eventName = 'email_click';
      channel = 'email';
    }
    if (!eventName && (href.indexOf('wa.me/') !== -1 || href.indexOf('whatsapp.com/') !== -1)) {
      eventName = 'whatsapp_click';
      channel = 'whatsapp';
    }
    if (!eventName) return;

    window.gttTrack(eventName, {
      contact_channel: channel || 'link',
      interaction_location: interactionLocation(link),
      transport_type: 'beacon'
    });
  });

  document.addEventListener('submit', function (event) {
    var form = event.target;
    if (!form || form.tagName !== 'FORM') return;
    if (typeof form.checkValidity === 'function' && !form.checkValidity()) return;

    var name = formName(form);
    var eventName = '';
    if (name === 'angebot') eventName = 'calculator_lead_submitted';
    if (name === 'kontakt') eventName = 'contact_form_submitted';
    if (!eventName) return;

    window.gttTrack(eventName, {
      form_type: name,
      interaction_location: interactionLocation(form),
      transport_type: 'beacon'
    });
  }, true);

  document.addEventListener('play', function (event) {
    var video = event.target;
    if (!video || video.tagName !== 'VIDEO') return;
    var id = videoId(video);
    window.gttTrack('video_started', {
      interaction_location: interactionLocation(video),
      video_id: id
    }, 'video_started:' + id);
  }, true);

  document.addEventListener('ended', function (event) {
    var video = event.target;
    if (!video || video.tagName !== 'VIDEO') return;
    var id = videoId(video);
    window.gttTrack('video_completed', {
      interaction_location: interactionLocation(video),
      video_id: id
    }, 'video_completed:' + id);
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      watchPriceReveal();
      reportThankYou();
    }, { once: true });
  } else {
    watchPriceReveal();
    reportThankYou();
  }
})();
