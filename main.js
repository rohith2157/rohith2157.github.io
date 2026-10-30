(function () {
  "use strict";

  var GITHUB_USER = "rohith2157";
  var root = document.documentElement;
  var deck = document.getElementById("deck");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { return null; }
  }

  /* ---------- letter-tile headings ---------- */
  document.querySelectorAll(".cell-text").forEach(function (h) {
    var word = h.getAttribute("aria-label") || "";
    word.split("").forEach(function (ch) {
      var s = document.createElement("span");
      s.setAttribute("aria-hidden", "true");
      s.textContent = ch;
      h.appendChild(s);
    });
  });

  // Keep each skill and its trailing comma together so a line never breaks inside a skill name.
  document.querySelectorAll(".skills-rows dd").forEach(function (dd) {
    var items = dd.textContent.split(",").map(function (s) { return s.trim(); });
    dd.textContent = "";
    items.forEach(function (item, i) {
      var chunk = document.createElement("span");
      chunk.className = "skill";
      chunk.textContent = item + (i < items.length - 1 ? "," : "");
      dd.appendChild(chunk);
      if (i < items.length - 1) dd.appendChild(document.createTextNode(" "));
    });
  });

  /* ---------- section navigation ---------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll(".deck-section"));
  var dock = document.querySelector(".dock");
  var dockLinks = Array.prototype.slice.call(dock.querySelectorAll("a"));
  var progress = document.getElementById("progress");
  dock.style.setProperty("--count", dockLinks.length);

  function goTo(id, smooth) {
    var target = document.getElementById(id);
    if (!target) return;
    deck.scrollTo({ top: target.offsetTop, behavior: smooth && !reduceMotion.matches ? "smooth" : "auto" });
    target.focus({ preventScroll: true });
    history.replaceState(null, "", "#" + id);
  }

  document.querySelectorAll("[data-nav]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href").slice(1);
      if (!document.getElementById(id)) return;
      e.preventDefault();
      goTo(id, true);
    });
  });

  function updateActive() {
    var probe = deck.scrollTop + deck.clientHeight * 0.4;
    var current = sections[0].id;
    sections.forEach(function (s) { if (s.offsetTop <= probe) current = s.id; });
    if (deck.scrollTop + deck.clientHeight >= deck.scrollHeight - 4) current = sections[sections.length - 1].id;
    dockLinks.forEach(function (a, i) {
      if (a.getAttribute("href") === "#" + current) {
        a.setAttribute("aria-current", "location");
        dock.style.setProperty("--active-section", i);
      } else a.removeAttribute("aria-current");
    });
    var max = deck.scrollHeight - deck.clientHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? deck.scrollTop / max : 0).toFixed(4) + ")";
  }
  deck.addEventListener("scroll", updateActive, { passive: true });
  window.addEventListener("resize", updateActive);
  // A deep link (#skills) stays pinned to its section while web fonts and GitHub data
  // reflow the page above it, until the visitor scrolls on their own.
  var anchored = location.hash.length > 1 ? document.getElementById(location.hash.slice(1)) : null;
  if (anchored && anchored.classList.contains("deck-section")) {
    goTo(anchored.id, false);
    var release = function () { anchored = null; };
    ["wheel", "touchstart", "keydown", "pointerdown"].forEach(function (type) {
      window.addEventListener(type, release, { passive: true, once: true });
    });
    if (window.ResizeObserver) {
      var pin = new ResizeObserver(function () { if (anchored) deck.scrollTop = anchored.offsetTop; });
      sections.forEach(function (s) { pin.observe(s); });
    }
  }
  updateActive();

  /* ---------- theme ---------- */
  var themeBtn = document.getElementById("theme-toggle");
  var darkQuery = window.matchMedia("(prefers-color-scheme: dark)");

  function currentTheme() {
    return root.dataset.theme || (darkQuery.matches ? "dark" : "light");
  }
  function renderThemeButton() {
    var t = currentTheme();
    themeBtn.querySelector("use").setAttribute("href", t === "dark" ? "#i-moon" : "#i-sun");
    themeBtn.querySelector("span").textContent = t;
    themeBtn.setAttribute("aria-label", "theme: " + t + ". switch to " + (t === "dark" ? "light" : "dark"));
  }
  themeBtn.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    store("theme", next);
    renderThemeButton();
    field.setDark(next === "dark");
  });
  darkQuery.addEventListener("change", function () { renderThemeButton(); field.setDark(currentTheme() === "dark"); });
  renderThemeButton();

  /* ---------- ocean background ---------- */
  var field = window.createOcean(document.getElementById("field"));
  field.setDark(currentTheme() === "dark");

  // Click or tap on open water to splash and scatter the fish.
  window.addEventListener("pointerdown", function (e) {
    if (e.target.closest(".deck, .dock, .topbar, a, button")) return;
    field.splash(e.clientX, e.clientY);
  });

  /* ---------- pause / play ---------- */
  var motionBtn = document.getElementById("motion-toggle");
  var savedMotion = store("motion");
  var paused = savedMotion ? savedMotion === "paused" : reduceMotion.matches;

  function renderMotion() {
    motionBtn.setAttribute("aria-pressed", String(paused));
    motionBtn.setAttribute("aria-label", paused ? "play background animation" : "pause background animation");
    motionBtn.querySelector("use").setAttribute("href", paused ? "#i-play" : "#i-pause");
    motionBtn.querySelector("span").textContent = paused ? "play" : "pause";
    if (paused) field.stop(); else field.start();
  }
  motionBtn.addEventListener("click", function () {
    paused = !paused;
    store("motion", paused ? "paused" : "playing");
    renderMotion();
  });
  renderMotion();
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) field.stop(); else if (!paused) field.start();
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(field.redraw);

  /* ---------- github sync ---------- */
  var MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

  function applyGithub(data) {
    var byName = {};
    data.repos.forEach(function (r) { byName[r.name.toLowerCase()] = r; });
    document.querySelectorAll("[data-repo]").forEach(function (card) {
      var repo = byName[card.getAttribute("data-repo").toLowerCase()];
      var meta = card.querySelector("[data-meta]");
      if (!repo || !meta) return;
      var d = new Date(repo.pushed_at);
      var parts = ["★ " + repo.stargazers_count];
      if (repo.language) parts.push(repo.language.toLowerCase());
      parts.push("updated " + MONTHS[d.getMonth()] + " " + d.getFullYear());
      meta.textContent = parts.join(" · ");
    });
    var stats = document.getElementById("gh-stats");
    var stars = data.repos.reduce(function (n, r) { return n + (r.fork ? 0 : r.stargazers_count); }, 0);
    stats.textContent = "· " + data.user.public_repos + " public repos · " + stars + " stars · " + data.user.followers + " followers";
    var when = new Date(data.fetchedAt);
    document.getElementById("sync-status").textContent =
      "synced with github " + when.getDate() + " " + MONTHS[when.getMonth()] + " " + when.getFullYear();
  }

  function syncGithub() {
    var cached = null;
    try { cached = JSON.parse(store("gh-cache") || "null"); } catch (e) {}
    if (cached && Date.now() - cached.fetchedAt < 60 * 60 * 1000) { applyGithub(cached); return; }

    var api = "https://api.github.com/users/" + GITHUB_USER;
    Promise.all([
      fetch(api).then(function (r) { if (!r.ok) throw r; return r.json(); }),
      fetch(api + "/repos?per_page=100&sort=pushed").then(function (r) { if (!r.ok) throw r; return r.json(); })
    ]).then(function (res) {
      var data = {
        fetchedAt: Date.now(),
        user: { public_repos: res[0].public_repos, followers: res[0].followers },
        repos: res[1].map(function (r) {
          return { name: r.name, stargazers_count: r.stargazers_count, language: r.language, pushed_at: r.pushed_at, fork: r.fork };
        })
      };
      store("gh-cache", JSON.stringify(data));
      applyGithub(data);
    }).catch(function () {
      // Offline or rate-limited: keep the values baked into the HTML (or the stale cache).
      if (cached) applyGithub(cached);
    });
  }
  syncGithub();
})();
