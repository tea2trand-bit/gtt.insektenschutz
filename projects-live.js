// Loads projects added through /admin and shows them at the top of the
// "Abgeschlossene Projekte" gallery (before the built-in examples).
(function(){
  var bilder = document.querySelector("#tab-bilder .projects-grid");
  var videos = document.querySelector("#tab-videos .projects-grid");
  if(!bilder || !videos || !window.fetch) return;

  function text(tag, value){
    var e = document.createElement(tag);
    e.textContent = value || "";
    return e;
  }

  function card(item){
    var article = document.createElement("article");
    article.className = "project-card";
    article.setAttribute("data-type", item.type);
    article.setAttribute("data-live", "1");
    var media;
    if(item.type === "video"){
      var wrap = document.createElement("div");
      wrap.className = "video-wrap";
      media = document.createElement("video");
      media.muted = true; media.loop = true; media.playsInline = true;
      media.setAttribute("playsinline", "");
      media.dataset.src = item.src;
      if(item.poster){
        media.preload = "none";
        media.poster = item.poster;
      } else {
        media.preload = "metadata";
        media.src = item.src + "#t=0.5";
      }
      var badge = document.createElement("span");
      badge.className = "play-badge";
      badge.textContent = "▶";
      wrap.appendChild(media);
      wrap.appendChild(badge);
      article.appendChild(wrap);
    } else {
      media = document.createElement("img");
      media.loading = "lazy";
      media.decoding = "async";
      media.src = item.src;
      media.alt = item.title ? "GTT Insektenschutz – " + item.title : "GTT Insektenschutz Projekt";
      article.appendChild(media);
    }
    var info = document.createElement("div");
    info.className = "project-info";
    info.appendChild(text("h3", item.title));
    info.appendChild(text("p", item.subtitle));
    article.appendChild(info);
    article.addEventListener("click", function(){
      if(typeof window.openItem === "function") window.openItem(media);
    });
    return article;
  }

  fetch("/api/projects", { headers: { "Accept": "application/json" } })
    .then(function(r){ return r.ok ? r.json() : { items: [] }; })
    .then(function(data){
      var items = (data && data.items) || [];
      var firstImg = bilder.firstElementChild, firstVid = videos.firstElementChild;
      items.forEach(function(item){
        if(item.type === "video") videos.insertBefore(card(item), firstVid);
        else bilder.insertBefore(card(item), firstImg);
      });
    })
    .catch(function(){ /* gallery keeps the built-in projects */ });
})();
