document.addEventListener("DOMContentLoaded", async () => {
  /* =========================================
     1. CONFIG
  ========================================= */
  const PROJECTS_JSON_URL = "./assets/js/projectsData.json";
  const MAP_PAGE_URL = "map.html"; // used when a project has no latitude / longitude

  const PLACEHOLDER =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 1000">' +
        '<rect width="1500" height="1000" fill="#f0f9f3"/>' +
        '<g fill="none" stroke="#1e665e" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity=".45">' +
        '<rect x="620" y="330" width="260" height="340" rx="8"/>' +
        '<path d="M680 400h40m60 0h40M680 470h40m60 0h40M680 540h40m60 0h40M730 670v-70h40v70"/>' +
        "</g></svg>",
    );

  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const canHover = window.matchMedia("(hover: hover)").matches;

  /* =========================================
     2. DOM
  ========================================= */
  const el = {
    hero: $("pdHero"),
    layout: $("pdLayout"),
    body: $("pdBody"),
    error: $("pdError"),
    errorText: $("pdErrorText"),
    gallery: document.querySelector(".pd-gallery"),
    stage: $("pdStage"),
    stageBg: $("stageBg"),
    mainImage: $("mainProjectImage"),
    counter: $("galleryCounter"),
    thumbs: $("galleryThumbnails"),
    prev: $("galleryPrev"),
    next: $("galleryNext"),
    thumbPrev: $("thumbnailPrev"),
    thumbNext: $("thumbnailNext"),
    fullscreen: $("galleryFullscreen"),

    lightbox: $("galleryLightbox"),
    lbFigure: $("lbFigure"),
    lbImage: $("lightboxImage"),
    lbThumbs: $("lbThumbs"),
    lbCounter: $("lightboxCounter"),
    lbCaption: $("lightboxCaption"),
    lbClose: $("lightboxClose"),
    lbPrev: $("lightboxPrev"),
    lbNext: $("lightboxNext"),
  };

  /* =========================================
     3. ICONS
  ========================================= */
  const ICONS = {
    users:
      '<circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2"/><path d="M17 4a4 4 0 0 1 0 8m2 3a6 6 0 0 1 3 5v1"/>',
    document: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7m-7 4h7"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5m6-6-6 6 6 6"/>',
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    coins:
      '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 10v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/><path d="M5 14v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    flag: '<path d="M5 21V4m0 0h12l-2 4 2 4H5"/>',
  };

  const svg = (name) =>
    `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONS[name] || ICONS.document}</svg>`;

  // Explicit-attribute icon (used for the prev / all / next buttons)
  const iconSvg = (name) =>
    `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" style="display:block">${ICONS[name]}</svg>`;

  /* =========================================
     4. HELPERS
  ========================================= */
  const esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );

  const clean = (v, fallback = "Not specified") => {
    const t = String(v ?? "").trim();
    return t || fallback;
  };

  const norm = (v) =>
    String(v ?? "")
      .normalize("NFKC")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, " ");

  const pad = (n) => String(n).padStart(2, "0");

  const hasValue = (v) =>
    v !== null && v !== undefined && String(v).trim() !== "";

  /* =========================================
     5. STATE
  ========================================= */
  let images = [];
  let index = 0;
  let previousFocus = null;
  let titleText = "";

  /* =========================================
     6. LOAD PROJECT
  ========================================= */
  try {
    const slug = new URLSearchParams(window.location.search).get("slug");
    if (!slug) throw new Error("Project slug is missing from the URL.");

    const res = await fetch(PROJECTS_JSON_URL, { cache: "no-cache" });
    if (!res.ok)
      throw new Error(`Unable to load project data (${res.status}).`);

    const data = await res.json();
    const projects = Array.isArray(data) ? data : data.projects;
    if (!Array.isArray(projects)) throw new Error("Invalid JSON format.");

    const position = projects.findIndex(
      (p) => String(p.slug ?? "").trim() === slug.trim(),
    );
    if (position === -1) throw new Error("Project not found.");

    const project = projects[position];

    renderHeader(project);
    renderValue(project);
    renderStats(project);
    renderBento(project);
    renderLocation(project);
    renderSiblings(projects, position);
    prepareGallery(project);
  } catch (err) {
    console.error(err);
    el.layout.hidden = true;
    el.body.hidden = true;
    el.error.hidden = false;
    el.errorText.textContent = err.message || "Something went wrong.";
  }

  initReveal();
  requestAnimationFrame(() => el.hero.classList.add("ready"));

  /* =========================================
     7. HEADER
  ========================================= */
  function renderHeader(p) {
    titleText = clean(p.title, "Untitled Project");
    document.title = `${titleText} | Projects`;

    $("projectNumber").textContent = clean(p.projectNumber, "Project");
    $("projectTypeChip").textContent = clean(p.projectType, "Project");

    $("projectTitle").innerHTML = titleText
      .split(/\s+/)
      .map(
        (w, i) =>
          `<span class="w"><span style="--w:${i}">${esc(w)}</span></span>`,
      )
      .join(" ");
    $("projectTitle").setAttribute("aria-label", titleText);

    const desc = String(p.projectDescription ?? "").trim();
    if (desc && norm(desc) !== norm(titleText)) {
      const lead = $("projectDescription");
      lead.textContent = desc;
      lead.hidden = false;
    }

    $("heroPin").innerHTML = svg("pin");
    $("heroLocation").textContent = clean(
      p.fullAddress || p.projectLocation || p.area,
      "Location not specified",
    );

    const status = clean(p.status, "Not specified");
    $("projectStatusText").textContent = status;
    $("projectStatus").classList.toggle(
      "is-completed",
      norm(status).includes("complete"),
    );
  }

  /* =========================================
     8. VALUE (count-up)
  ========================================= */
  function renderValue(p) {
    $("valueIcon").innerHTML = ICONS.coins;

    const text = clean(p.projectValue);
    const match = text.match(/^([A-Za-z]{2,4})\s+(.+)$/);
    const amountText = match ? match[2].trim() : text;

    $("valueCurrency").textContent = match ? match[1] : "";
    const numberEl = $("valueNumber");
    numberEl.textContent = amountText;

    const amount = Number(amountText.replace(/,/g, ""));
    if (!Number.isFinite(amount) || reduceMotion) return;

    const fmt = new Intl.NumberFormat("en-US");
    numberEl.textContent = "0";

    const run = () => {
      const duration = 1800;
      let startTime = null;

      const tick = (now) => {
        if (startTime === null) startTime = now;
        const t = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 4);
        numberEl.textContent = fmt.format(Math.round(amount * eased));
        if (t < 1) requestAnimationFrame(tick);
        else numberEl.textContent = amountText;
      };
      requestAnimationFrame(tick);
    };

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            io.disconnect();
            setTimeout(run, 350);
          }
        },
        { threshold: 0.3 },
      );
      io.observe($("projectValue"));
    } else {
      run();
    }
  }

  /* =========================================
     9. HERO STATS
  ========================================= */
  function renderStats(p) {
    const completed = norm(p.status).includes("complete");

    const stats = [
      { icon: completed ? "check" : "flag", label: "Status", value: p.status },
      { icon: "calendar", label: "Start Date", value: p.startDate },
      {
        icon: completed ? "check" : "clock",
        label: completed ? "Completed On" : "Completion",
        value: p.completionDate,
      },
    ];

    $("pdStats").innerHTML = stats
      .map(
        (s, i) => `
        <div class="pd-stat reveal" style="--i:${i + 5}">
          <span class="pd-stat-icon">${svg(s.icon)}</span>
          <div>
            <small>${esc(s.label)}</small>
            <strong>${esc(clean(s.value))}</strong>
          </div>
        </div>`,
      )
      .join("");
  }

  /* =========================================
     10. KEY INFORMATION (bento)
  ========================================= */
  function renderBento(p) {
    const cards = [
      {
        icon: "users",
        label: "Client",
        value: p.client,
        cls: "bento--wide bento--dark",
      },
      {
        icon: "document",
        label: "Consultant",
        value: p.consultant,
        cls: "bento--wide bento--mint",
      },
    ];

    const box = $("pdBento");

    box.innerHTML = cards
      .map(
        (c, i) => `
        <article class="bento ${c.cls || ""} reveal" style="--i:${i}">
          <span class="bento-mark">${svg(c.icon)}</span>
          <div class="bento-top">
            <span class="bento-icon">${svg(c.icon)}</span>
            <span class="pd-label">${esc(c.label)}</span>
          </div>
          <div>
            <strong class="bento-value">${esc(clean(c.value))}</strong>
            ${String(c.sub ?? "").trim() ? `<span class="bento-sub">${esc(String(c.sub).trim())}</span>` : ""}
            <i class="bento-line"></i>
          </div>
        </article>`,
      )
      .join("");

    if (canHover) {
      box.addEventListener("mousemove", (e) => {
        const card = e.target.closest(".bento");
        if (!card) return;
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      });
    }
  }

  /* =========================================
     12. LOCATION + MAP
  ========================================= */
  function renderLocation(p) {
    $("locationIcon").innerHTML = svg("pin");
    $("mapArrow").innerHTML = svg("arrow");

    const address = clean(
      p.fullAddress || p.projectLocation || p.area,
      "Location not specified",
    );
    $("projectLocation").textContent = address;

    const meta = [p.area, p.state]
      .map((v) => String(v ?? "").trim())
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i);

    const lat = Number(p.latitude);
    const lng = Number(p.longitude);
    const hasCoords =
      hasValue(p.latitude) &&
      hasValue(p.longitude) &&
      Number.isFinite(lat) &&
      Number.isFinite(lng);

    $("mapMeta").textContent = meta.join("  •  ");

    const link = $("mapLink");

    if (hasCoords) {
      /* Has coordinates: open Google Maps in a new tab */
      link.href = `https://www.google.com/maps?q=${lat},${lng}`;
      link.target = "_blank";
      link.rel = "noopener";
    } else {
      /* No coordinates: go to map.html */
      const slug = String(p.slug ?? "").trim();
      link.href = slug
        ? `${MAP_PAGE_URL}?slug=${encodeURIComponent(slug)}`
        : MAP_PAGE_URL;
      link.removeAttribute("target");
      link.removeAttribute("rel");

      const label = link.querySelector("span");
      if (label) label.textContent = "View on Map";
    }
  }

  /* =========================================
     13. PREVIOUS / ALL / NEXT  (icons only)
  ========================================= */
  function renderSiblings(projects, pos) {
    if (projects.length < 2) return;

    const prevP = projects[(pos - 1 + projects.length) % projects.length];
    const nextP = projects[(pos + 1) % projects.length];

    const href = (proj) =>
      `project-details.html?slug=${encodeURIComponent(String(proj.slug ?? proj.id ?? ""))}`;

    const prevTip = `Previous: ${clean(prevP.title, "Project")}`;
    const nextTip = `Next: ${clean(nextP.title, "Project")}`;

    const box = $("pdSiblings");
    box.innerHTML = `
      <a class="pd-ico pd-ico--prev" href="${esc(href(prevP))}"
         aria-label="${esc(prevTip)}" data-tip="${esc(prevTip)}">${iconSvg("arrowLeft")}</a>
      <a class="pd-ico pd-ico--all" href="projects.html"
         aria-label="All projects" data-tip="All projects">${iconSvg("grid")}</a>
      <a class="pd-ico pd-ico--next" href="${esc(href(nextP))}"
         aria-label="${esc(nextTip)}" data-tip="${esc(nextTip)}">${iconSvg("arrow")}</a>`;
    box.hidden = false;
  }

  /* =========================================
     14. GALLERY
  ========================================= */
  function prepareGallery(p) {
    const list = [
      p.image,
      ...(Array.isArray(p.images) ? p.images : []),
      ...(Array.isArray(p.gallery) ? p.gallery : []),
    ]
      .map((item) =>
        typeof item === "string"
          ? item.trim()
          : String(item?.src ?? item?.url ?? item?.image ?? "").trim(),
      )
      .filter(Boolean);

    images = [...new Set(list)];
    if (!images.length) images = [PLACEHOLDER];

    const single = images.length < 2;
    el.gallery.classList.toggle("is-single", single);
    el.lightbox.classList.toggle("single", single);

    el.thumbs.replaceChildren();
    el.lbThumbs.replaceChildren();

    images.forEach((src, i) => {
      const make = (cls) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = cls;
        btn.setAttribute("aria-label", `View image ${i + 1}`);

        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = i === 0 ? "eager" : "lazy";
        img.decoding = "async";
        img.addEventListener("error", () => {
          if (img.src !== PLACEHOLDER) img.src = PLACEHOLDER;
        });

        btn.appendChild(img);
        btn.addEventListener("click", () => show(i));
        return btn;
      };

      el.thumbs.appendChild(make("pd-thumb"));
      el.lbThumbs.appendChild(make("lb-thumb"));
    });

    show(0);
  }

  function centerIn(container, item) {
    if (!container || !item) return;
    container.scrollTo({
      left: item.offsetLeft - (container.clientWidth - item.clientWidth) / 2,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  function show(i) {
    index = (i + images.length) % images.length;
    const src = images[index];

    el.mainImage.classList.remove("fade-in");
    void el.mainImage.offsetWidth;
    el.mainImage.src = src;
    el.mainImage.alt = `${titleText} - image ${index + 1}`;
    el.mainImage.classList.add("fade-in");

    el.counter.textContent = `${pad(index + 1)} / ${pad(images.length)}`;

    const thumbs = el.thumbs.querySelectorAll(".pd-thumb");
    thumbs.forEach((t, n) => {
      t.classList.toggle("active", n === index);
      t.setAttribute("aria-pressed", String(n === index));
    });
    centerIn(el.thumbs, thumbs[index]);

    if (el.lightbox.classList.contains("open")) updateLightbox();
  }

  el.mainImage.addEventListener("error", () => {
    if (el.mainImage.src !== PLACEHOLDER) el.mainImage.src = PLACEHOLDER;
  });

  el.prev.addEventListener("click", (e) => {
    e.stopPropagation();
    show(index - 1);
  });
  el.next.addEventListener("click", (e) => {
    e.stopPropagation();
    show(index + 1);
  });

  el.thumbPrev.addEventListener("click", () =>
    el.thumbs.scrollBy({
      left: -el.thumbs.clientWidth * 0.75,
      behavior: "smooth",
    }),
  );
  el.thumbNext.addEventListener("click", () =>
    el.thumbs.scrollBy({
      left: el.thumbs.clientWidth * 0.75,
      behavior: "smooth",
    }),
  );

  // Click the main image (not a button) to open the lightbox
  el.stage.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    openLightbox();
  });
  el.fullscreen.addEventListener("click", (e) => {
    e.stopPropagation();
    openLightbox();
  });

  addSwipe(
    el.stage,
    () => show(index + 1),
    () => show(index - 1),
  );

  /* =========================================
     15. LIGHTBOX (full image visible)
  ========================================= */
  function updateLightbox() {
    el.lbFigure.classList.remove("zoomed");
    el.lbImage.style.transformOrigin = "";

    el.lbImage.classList.remove("fade-in");
    void el.lbImage.offsetWidth;
    el.lbImage.src = images[index];
    el.lbImage.alt = el.mainImage.alt;
    el.lbImage.classList.add("fade-in");

    el.lbCounter.textContent = `${pad(index + 1)} / ${pad(images.length)}`;
    el.lbCaption.textContent = titleText;

    const thumbs = el.lbThumbs.querySelectorAll(".lb-thumb");
    thumbs.forEach((t, n) => t.classList.toggle("active", n === index));
    centerIn(el.lbThumbs, thumbs[index]);
  }

  function openLightbox() {
    previousFocus = document.activeElement;
    updateLightbox();
    el.lightbox.inert = false;
    el.lightbox.setAttribute("aria-hidden", "false");
    el.lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
    el.lbClose.focus({ preventScroll: true });
  }

  function closeLightbox() {
    el.lightbox.classList.remove("open");
    el.lightbox.setAttribute("aria-hidden", "true");
    el.lightbox.inert = true;
    el.lbFigure.classList.remove("zoomed");
    document.body.style.overflow = "";
    if (previousFocus && previousFocus.isConnected)
      previousFocus.focus({ preventScroll: true });
  }

  el.lbClose.addEventListener("click", closeLightbox);
  el.lbPrev.addEventListener("click", () => show(index - 1));
  el.lbNext.addEventListener("click", () => show(index + 1));

  el.lightbox.addEventListener("click", (e) => {
    if (e.target === el.lightbox || e.target === el.lbFigure) {
      if (el.lbFigure.classList.contains("zoomed"))
        el.lbFigure.classList.remove("zoomed");
      else closeLightbox();
    }
  });

  el.lbImage.addEventListener("click", (e) => {
    const zoomed = el.lbFigure.classList.toggle("zoomed");
    if (zoomed) setOrigin(e);
    else el.lbImage.style.transformOrigin = "";
  });

  el.lbFigure.addEventListener("mousemove", (e) => {
    if (el.lbFigure.classList.contains("zoomed")) setOrigin(e);
  });

  function setOrigin(e) {
    const r = el.lbImage.getBoundingClientRect();
    const x = Math.min(
      Math.max(((e.clientX - r.left) / r.width) * 100, 0),
      100,
    );
    const y = Math.min(
      Math.max(((e.clientY - r.top) / r.height) * 100, 0),
      100,
    );
    el.lbImage.style.transformOrigin = `${x}% ${y}%`;
  }

  addSwipe(
    el.lightbox,
    () => show(index + 1),
    () => show(index - 1),
  );

  document.addEventListener("keydown", (e) => {
    if (!el.lightbox.classList.contains("open")) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeLightbox();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      show(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      show(index + 1);
    }
  });

  /* =========================================
     16. SWIPE HELPER
  ========================================= */
  function addSwipe(target, onLeft, onRight) {
    let x = 0;
    let y = 0;

    target.addEventListener(
      "touchstart",
      (e) => {
        x = e.changedTouches[0].clientX;
        y = e.changedTouches[0].clientY;
      },
      { passive: true },
    );

    target.addEventListener(
      "touchend",
      (e) => {
        if (images.length < 2) return;
        const dx = e.changedTouches[0].clientX - x;
        const dy = e.changedTouches[0].clientY - y;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
          if (dx < 0) onLeft();
          else onRight();
        }
      },
      { passive: true },
    );
  }

  /* =========================================
     17. SCROLL REVEAL
  ========================================= */
  function initReveal() {
    const items = document.querySelectorAll(".reveal");

    if (!("IntersectionObserver" in window) || reduceMotion) {
      items.forEach((n) => n.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    items.forEach((n) => io.observe(n));
  }
});