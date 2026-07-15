
const FENSTER=149, TUEREN=249;
const plz=document.getElementById('plz'), fenster=document.getElementById('fenster'), tueren=document.getElementById('tueren'), price=document.getElementById('price'), notice=document.getElementById('notice');
const priceLabel=document.getElementById('priceLabel');
const calcBox=document.querySelector('.calc');
function chf(n){return 'CHF '+Math.round(n).toLocaleString('de-CH')+'.–'}
function standard(code){if(!code)return true; const n=parseInt(code,10); return (n>=8000&&n<=8999)||(n>=9000&&n<=9999)}
function isOutside(){const code=(plz.value||'').trim(); return code.length>=4&&!standard(code);}
function update(){
  const f=parseFloat((fenster.value||'').replace(',','.'))||0;
  const t=parseFloat((tueren.value||'').replace(',','.'))||0;
  const total=f*FENSTER+t*TUEREN;
  const outside=isOutside();

  if(outside){
    price.textContent=chf(total);
    priceLabel.textContent='Orientierungspreis';
    notice.classList.remove('hidden');
    notice.classList.add('notice-outside');
    calcBox.classList.add('outside-area');
  } else {
    price.textContent=chf(total);
    priceLabel.textContent='Ihr Fixpreis (alles inklusive)';
    notice.classList.add('hidden');
    notice.classList.remove('notice-outside');
    calcBox.classList.remove('outside-area');
  }

  // Keep the hidden Netlify form fields continuously in sync with the calculator.
  // This guarantees PLZ, Flächen, Preis und Servicegebiet-Status are always part
  // of the form data when it is submitted – regardless of whether the submission
  // goes through the AJAX handler or falls back to a native browser submit.
  const fPlz=document.getElementById('formPlz'); if(fPlz) fPlz.value=(plz.value||'').trim();
  const fFen=document.getElementById('formFenster'); if(fFen) fFen.value=f;
  const fTue=document.getElementById('formTueren'); if(fTue) fTue.value=t;
  const fPre=document.getElementById('formPreis'); if(fPre) fPre.value=(outside?'Orientierungspreis':'Fixpreis')+': '+chf(total);
  const fSvc=document.getElementById('formServicegebiet'); if(fSvc) fSvc.value=outside?'PLZ ausserhalb Standard-Servicegebiet':'Standard-Servicegebiet';

  // Only promise a ready offer once the visitor has actually entered data:
  // a valid PLZ (>= 4 digits) plus at least one area value (window or door).
  // Show the transparent price as soon as the visitor has entered enough data.
  const teaserEl=document.getElementById('offerTeaser');
  const revealEl=document.getElementById('priceReveal');
  const hasPlz=((plz.value||'').trim()).length>=4;
  const hasArea=f>0||t>0;
  const canShowPrice=hasPlz&&hasArea;
  if(revealEl) revealEl.classList.toggle('hidden', !canShowPrice);
  if(teaserEl) teaserEl.classList.toggle('hidden', !canShowPrice);
}
[plz,fenster,tueren].forEach(e=>e.addEventListener('input',update)); update();

// Disable mousewheel on number inputs
document.querySelectorAll('.calc input[type="number"]').forEach(function(inp){
  inp.addEventListener('wheel',function(e){e.preventDefault();},{passive:false});
});

// Stepper +/- buttons
document.querySelectorAll('.stepper-btn').forEach(function(btn){
  btn.addEventListener('click',function(){
    var target=document.getElementById(btn.getAttribute('data-target'));
    if(!target) return;
    var val=parseFloat(target.value)||0;
    if(btn.classList.contains('stepper-plus')){
      val=Math.round((val+0.1)*10)/10;
    } else {
      val=Math.round((val-0.1)*10)/10;
      if(val<0) val=0;
    }
    target.value=val.toFixed(1);
    target.dispatchEvent(new Event('input'));
  });
});
// Projects gallery preview + lightbox
const projectsGrid = document.getElementById("projectsGrid");
const uploadInput = document.getElementById("projectUpload");
const lightbox = document.getElementById("lightbox");
const lightboxContent = document.getElementById("lightboxContent");
const lightboxClose = document.getElementById("lightboxClose");

function openLightboxFromElement(media){
  if(!media || !lightbox || !lightboxContent) return;
  lightboxContent.innerHTML = "";
  let clone;
  if(media.tagName.toLowerCase() === "video"){
    clone = document.createElement("video");
    clone.src = media.currentSrc || media.src;
    clone.controls = true;
    clone.autoplay = false;
    clone.muted = false;
  } else {
    clone = document.createElement("img");
    clone.src = media.src;
    clone.alt = media.alt || "";
  }
  lightboxContent.appendChild(clone);
  lightbox.classList.add("active");
  lightbox.setAttribute("aria-hidden","false");
}

if(projectsGrid){
  projectsGrid.addEventListener("click", (e)=>{
    const card = e.target.closest(".project-card");
    if(!card) return;
    const media = card.querySelector("img, video");
    if(media) openLightboxFromElement(media);
  });
}

if(lightboxClose){
  lightboxClose.addEventListener("click", ()=>{
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden","true");
    lightboxContent.innerHTML = "";
  });
}
if(lightbox){
  lightbox.addEventListener("click", (e)=>{
    if(e.target === lightbox){
      lightbox.classList.remove("active");
      lightbox.setAttribute("aria-hidden","true");
      lightboxContent.innerHTML = "";
    }
  });
}

if(uploadInput && projectsGrid){
  uploadInput.addEventListener("change", ()=>{
    Array.from(uploadInput.files).forEach((file)=>{
      const url = URL.createObjectURL(file);
      const card = document.createElement("article");
      card.className = "project-card";
      let media;
      if(file.type.startsWith("video/")){
        media = document.createElement("video");
        media.src = url;
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.autoplay = false;
      } else {
        media = document.createElement("img");
        media.src = url;
        media.alt = "Neu hinzugefügtes Projekt";
      }
      const info = document.createElement("div");
      info.className = "project-info";
      info.innerHTML = "<h3>Neues Projekt</h3><p>Lokale Vorschau · später hochladen</p>";
      card.appendChild(media);
      card.appendChild(info);
      projectsGrid.prepend(card);
    });
  });
}

// Projects tabs + lightbox with arrows
const tabButtons=document.querySelectorAll(".tab-button");
const tabContents=document.querySelectorAll(".tab-content");
tabButtons.forEach(btn=>btn.addEventListener("click",()=>{
  tabButtons.forEach(b=>b.classList.remove("active"));
  tabContents.forEach(c=>c.classList.remove("active"));
  btn.classList.add("active");
  const t=document.getElementById("tab-"+btn.dataset.tab);
  if(t)t.classList.add("active");
}));

let galleryItems=[], currentIndex=0;
function openItem(media){
  const tab=media.closest(".tab-content");
  galleryItems=Array.from(tab.querySelectorAll(".project-card img,.project-card video"));
  currentIndex=galleryItems.indexOf(media);
  showItem(currentIndex);
}
function showItem(i){
  if(!galleryItems.length)return;
  currentIndex=(i+galleryItems.length)%galleryItems.length;
  const media=galleryItems[currentIndex];
  const lb=document.getElementById("lightbox");
  const content=document.getElementById("lightboxContent");
  content.innerHTML="";
  let el;
  if(media.tagName.toLowerCase()==="video"){
    el=document.createElement("video");
    el.src=media.currentSrc||media.src;
    el.controls=true; el.autoplay=false; el.playsInline=true;
  }else{
    el=document.createElement("img");
    el.src=media.src; el.alt=media.alt||"";
  }
  content.appendChild(el);
  lb.classList.add("active");
}
document.querySelectorAll(".project-card").forEach(card=>card.addEventListener("click",()=>{
  const m=card.querySelector("img,video"); if(m) openItem(m);
}));
const lb=document.getElementById("lightbox");
const close=document.getElementById("lightboxClose");
const prev=document.getElementById("lightboxPrev");
const next=document.getElementById("lightboxNext");
if(close)close.addEventListener("click",()=>{lb.classList.remove("active");document.getElementById("lightboxContent").innerHTML="";});
if(prev)prev.addEventListener("click",(e)=>{e.stopPropagation();showItem(currentIndex-1);});
if(next)next.addEventListener("click",(e)=>{e.stopPropagation();showItem(currentIndex+1);});
if(lb)lb.addEventListener("click",(e)=>{if(e.target===lb){lb.classList.remove("active");document.getElementById("lightboxContent").innerHTML="";}});
document.addEventListener("keydown",(e)=>{if(!lb||!lb.classList.contains("active"))return;if(e.key==="ArrowLeft")showItem(currentIndex-1);if(e.key==="ArrowRight")showItem(currentIndex+1);if(e.key==="Escape"){lb.classList.remove("active");document.getElementById("lightboxContent").innerHTML="";}});







// FINAL POLISH: reliable calculator transfer, modal close, submit without 404
(function(){
  function parseNum(v){
    return parseFloat(String(v || "").replace(",", ".")) || 0;
  }

  function visibleInputsInCalculator(){
    const calc = document.querySelector('.calculator, .calc-card, .price-card, .hero-card, [class*="calc"], [class*="price"]') || document;
    return Array.from(calc.querySelectorAll('input')).filter(i => i.type !== 'hidden');
  }

  function findByContext(words){
    const inputs = Array.from(document.querySelectorAll('input')).filter(i => i.type !== 'hidden');
    for(const input of inputs){
      const box = input.closest('label, div, p, article, section') || input.parentElement;
      const text = ((box && box.innerText) || "") + " " + (input.placeholder || "") + " " + (input.name || "") + " " + (input.id || "");
      const t = text.toLowerCase();
      if(words.every(w => t.includes(w))) return input;
    }
    return null;
  }

  function getCalcData(){
    const visible = visibleInputsInCalculator();

    let plzEl = document.querySelector('#calcPlz, #plz, #plzInput, #plz_input, input[name="calc_plz"], input[name="plz"]') || findByContext(['plz']) || visible[0];
    let fensterEl = document.querySelector('#calcFenster, #fenster, #fensterInput, #fenster_input, #fensterflaeche, input[name="calc_fenster"], input[name="fensterflaeche"]') || findByContext(['fenster']) || visible[1];
    let tuerenEl = document.querySelector('#calcTueren, #tueren, #tuerenInput, #tueren_input, #tuerflaeche, input[name="calc_tueren"], input[name="tuerflaeche"]') || findByContext(['tür']) || findByContext(['tuer']) || findByContext(['plissee']) || visible[2];

    const plzVal = plzEl ? plzEl.value : "";
    const fVal = parseNum(fensterEl ? fensterEl.value : 0);
    const tVal = parseNum(tuerenEl ? tuerenEl.value : 0);

    const livePrice = document.querySelector('.price, #price, #preis, [data-price], .total-price, .fixpreis');
    let priceText = livePrice && livePrice.textContent.trim() ? livePrice.textContent.trim() : "";
    if(!priceText || priceText === "CHF 0.–" || priceText === "CHF 0.-" || priceText === "CHF 0.—"){
      priceText = "CHF " + Math.round((fVal * 149) + (tVal * 249)).toLocaleString("de-CH") + ".–";
    }

    const outside = isOutside();
    const servicegebietStatus = outside ? "PLZ ausserhalb Standard-Servicegebiet" : "Standard-Servicegebiet";
    const priceType = outside ? "Orientierungspreis" : "Fixpreis";

    return {plz: plzVal, fenster: fVal, tueren: tVal, priceText: priceType + ': ' + priceText, servicegebiet: servicegebietStatus, isOutside: outside};
  }

  function setText(id, value){
    const el = document.getElementById(id);
    if(el) el.textContent = value;
  }
  function setValue(id, value){
    const el = document.getElementById(id);
    if(el) el.value = value;
  }

  function openModal(id){
    const modal = document.getElementById(id);
    if(!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(id){
    const modal = document.getElementById(id);
    if(!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  function closeAll(){
    closeModal('anfrageModal');
    closeModal('b2bModal');
    closeModal('successModal');
  }

  // Reveal the calculated price only after the offer form was submitted
  function revealOffer(){
    const teaser = document.getElementById('offerTeaser');
    const offerForm = document.getElementById('offerForm');
    const reveal = document.getElementById('priceReveal');
    if(teaser) teaser.classList.add('hidden');
    if(offerForm) offerForm.classList.add('hidden');
    if(reveal){
      reveal.classList.remove('hidden');
      try{ reveal.scrollIntoView({behavior:'smooth', block:'center'}); }catch(e){}
    }
  }

  window.gttOpenPrivateAnfrage = function(){
    const data = getCalcData();

    setText('summaryPlz', data.plz || '–');
    setText('summaryFenster', data.fenster + ' m²');
    setText('summaryTueren', data.tueren + ' m²');
    setText('summaryPreisLabel', data.isOutside ? 'Orientierungspreis' : 'Fixpreis');
    setText('summaryPreis', data.priceText);

    setValue('formPlz', data.plz);
    setValue('formFenster', data.fenster);
    setValue('formTueren', data.tueren);
    setValue('formPreis', data.priceText);
    setValue('formServicegebiet', data.servicegebiet);

    openModal('anfrageModal');
    const first = document.querySelector('#anfrageModal input[name="name"]');
    if(first) setTimeout(()=>first.focus(), 80);
  };

  window.gttOpenB2BAnfrage = function(){
    openModal('b2bModal');
    const first = document.querySelector('#b2bModal input[name="firma"], #b2bModal input[name="name"]');
    if(first) setTimeout(()=>first.focus(), 80);
  };

  document.addEventListener('click', function(e){
    const privateBtn = e.target.closest('[data-open-private]');
    if(privateBtn){
      e.preventDefault();
      window.gttOpenPrivateAnfrage();
      return;
    }

    const b2bBtn = e.target.closest('[data-open-b2b]');
    if(b2bBtn){
      e.preventDefault();
      window.gttOpenB2BAnfrage();
      return;
    }

    if(e.target.closest('[data-close-private]')){
      e.preventDefault();
      closeModal('anfrageModal');
      return;
    }
    if(e.target.closest('[data-close-b2b]')){
      e.preventDefault();
      closeModal('b2bModal');
      return;
    }
    if(e.target.closest('[data-close-success]')){
      e.preventDefault();
      closeModal('successModal');
      return;
    }
  }, true);

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape') closeAll();
  });

  async function submitForm(form){
    const formData = new FormData(form);
    return fetch("/", {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: new URLSearchParams(formData).toString()
    });
  }

  document.querySelectorAll('form[data-netlify="true"]:not([hidden])').forEach(form => {
    form.addEventListener('submit', async function(e){
      e.preventDefault();

      if(form.getAttribute('name') === 'angebot') {
        const data = getCalcData();
        setValue('formPlz', data.plz);
        setValue('formFenster', data.fenster);
        setValue('formTueren', data.tueren);
        setValue('formPreis', data.priceText);
        setValue('formServicegebiet', data.servicegebiet);
      }

      const btn = form.querySelector('button[type="submit"]');
      const oldText = btn ? btn.textContent : "";
      if(btn){ btn.disabled = true; btn.textContent = "Wird gesendet..."; }

      try{
        const response = await submitForm(form);
        if(!response.ok){ throw new Error('Netlify form submit failed: ' + response.status); }
        if(form.getAttribute('name') === 'angebot'){ revealOffer(); }
        form.reset();
        closeAll();
        openModal('successModal');
      }catch(error){
        console.error(error);
        alert("Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie per WhatsApp.");
      }finally{
        if(btn){ btn.disabled = false; btn.textContent = oldText; }
      }
    });
  });
})();

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

// Mobile hamburger menu
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
    link.addEventListener('click', function(){
      closeMenu();
    });
  });
})();
