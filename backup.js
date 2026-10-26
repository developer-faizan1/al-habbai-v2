/* =========================================
   PROJECTS CONFIGURATION
========================================= */

const PROJECTS_JSON_URL = "assets/js/projectsData.json";
const PROJECTS_PER_PAGE = 8;

const projectsList = document.getElementById("projectsList");
const projectSearch = document.getElementById("projectSearch");
const projectTypeFilter = document.getElementById("projectTypeFilter");
const projectStatusFilter = document.getElementById("projectStatusFilter");
const projectLocationFilter = document.getElementById("projectLocationFilter");
const projectSort = document.getElementById("projectSort");
const clearFilters = document.getElementById("clearFilters");
const emptyClearFilters = document.getElementById("emptyClearFilters");
const projectsPagination = document.getElementById("projectsPagination");
const projectsEmpty = document.getElementById("projectsEmpty");

const lightbox = document.getElementById("projectLightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxCaption = document.getElementById("lightboxCaption");
const lightboxClose = document.getElementById("lightboxClose");
const lightboxPrev = document.getElementById("lightboxPrev");
const lightboxNext = document.getElementById("lightboxNext");

let allProjects = [];
let filteredProjects = [];
let currentPage = 1;
let lightboxImages = [];
let lightboxIndex = 0;
let previousFocus = null;

/* =========================================
   HELPERS
========================================= */

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

function textValue(value, fallback = "Not specified") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
}

function uniqueValues(projects, key) {
  return [
    ...new Set(
      projects.map((p) => String(p[key] ?? "").trim()).filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));
}

function formatValue(value) {
  return textValue(value, "Not specified");
}

/* =========================================
   SVG ICONS
========================================= */

function iconSVG(name) {
  const icons = {
    layers:
      '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
    building:
      '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2m2 0h2M9 11h2m2 0h2M9 15h2m2 0h2M10 21v-3h4v3"/>',
    home:
      '<path d="m3 10 9-7 9 7"/><path d="M5 9v12h14V9M9 21v-7h6v7"/>',
    roof:
      '<path d="m3 14 9-9 9 9"/><path d="m14 5 5-3 1 4"/><path d="M6 12v8h12v-8"/>',
    users:
      '<circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2"/><path d="M17 4a4 4 0 0 1 0 8m2 3a6 6 0 0 1 3 5v1"/>',
    document:
      '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 12h7m-7 4h7"/>',
    map:
      '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
    image:
      '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 18 5-5 4 4 3-3 4 4"/>',
    coins:
      '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 10v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/><path d="M5 14v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/>',
  };

  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${icons[name] || icons.document}</svg>`;
}

/* =========================================
   STATUS (Completed / Running)
========================================= */

function getStatusConfig(status) {
  const key = normalizeText(status);

  if (key.includes("complete")) {
    return { label: "Completed", className: "status-completed" };
  }

  return { label: "Running", className: "status-running" };
}

/* =========================================
   DATE HELPERS
========================================= */

function parseProjectDate(value) {
  if (!value) return 0;

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed.getTime();

  const match = String(value)
    .trim()
    .match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);
  if (!match) return 0;

  const months = {
    january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
    july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  };

  const month = months[match[2].toLowerCase()];
  if (month === undefined) return 0;

  return new Date(Number(match[3]), month, Number(match[1])).getTime();
}

/* =========================================
   FILTER OPTIONS
========================================= */

function populateSelect(select, values, defaultLabel) {
  const previousValue = select.value;
  select.replaceChildren();

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = defaultLabel;
  select.appendChild(defaultOption);

  values.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });

  if (values.includes(previousValue)) select.value = previousValue;
}

function populateFilters() {
  populateSelect(projectTypeFilter, uniqueValues(allProjects, "projectType"), "All Types");
  populateSelect(projectStatusFilter, ["Completed", "Running"], "All Status");

  const locations = [
    ...new Set(
      allProjects
        .map((p) => String(p.projectLocation ?? p.area ?? "").trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  populateSelect(projectLocationFilter, locations, "All Locations");
}

/* =========================================
   PROJECT COMPRISES
   Accepts strings ("14 Floors") or objects
   ({ "title": "14 Floors", "subtitle": "Residential" })
========================================= */

function getComprisesIcon(title) {
  const v = normalizeText(title);

  if (v.includes("roof")) return "roof";
  if (v.includes("ground floor")) return "home";
  if (v.includes("basement") || v.includes("under ground") || v.includes("underground")) return "layers";
  return "building";
}

function getComprisesSubtitle(title, project) {
  const v = normalizeText(title);

  if (v.includes("roof")) return "Top Level";
  if (v.includes("ground floor")) return "Ground Level";
  if (v.includes("basement") || v.includes("under ground") || v.includes("underground")) return "Below Ground";
  if (v.includes("podium")) return "Podium Level";
  if (v.includes("parking")) return "Parking Level";
  if (/\bfloors?\b/.test(v)) {
    return normalizeText(project.projectType).includes("residential")
      ? "Residential"
      : "Typical Floors";
  }
  return "";
}

function normalizeComprises(project) {
  const list = Array.isArray(project.projectComprisesOf)
    ? project.projectComprisesOf
    : [];

  return list
    .map((item) => {
      if (item && typeof item === "object") {
        const title = String(item.title ?? item.name ?? "").trim();
        return {
          title,
          subtitle: String(item.subtitle ?? "").trim() || getComprisesSubtitle(title, project),
        };
      }
      const title = String(item ?? "").trim();
      return { title, subtitle: getComprisesSubtitle(title, project) };
    })
    .filter((item) => item.title)
    .slice(0, 4);
}

let waveCounter = 0;

function waveSVG() {
  const id = `comprisesWave${++waveCounter}`;

  return `
    <svg class="comprises-wave" viewBox="0 0 400 76" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="${id}Glow">
          <stop offset="0%" stop-color="#fff3d1" stop-opacity="1"/>
          <stop offset="45%" stop-color="#e3b865" stop-opacity="0.9"/>
          <stop offset="100%" stop-color="#c9a15f" stop-opacity="0"/>
        </radialGradient>
      </defs>

      <!-- Base curve -->
      <path id="${id}" class="wave-base" vector-effect="non-scaling-stroke"
        d="M0 44 C 20 30, 30 20, 50 38 S 90 66, 150 56 S 215 18, 280 30 S 350 56, 400 36"/>

      <!-- Flowing dashes -->
      <use href="#${id}" class="wave-flow" vector-effect="non-scaling-stroke"/>

      <!-- Travelling glow dots (run forever) -->
      <circle r="9" fill="url(#${id}Glow)" class="wave-dot">
        <animateMotion dur="7s" repeatCount="indefinite" begin="0s">
          <mpath href="#${id}"/>
        </animateMotion>
      </circle>
      <circle r="9" fill="url(#${id}Glow)" class="wave-dot">
        <animateMotion dur="7s" repeatCount="indefinite" begin="-3.5s">
          <mpath href="#${id}"/>
        </animateMotion>
      </circle>
    </svg>
  `;
}

/* =========================================
   PROJECT CARD
========================================= */

function projectCard(project) {
  const status = getStatusConfig(project.status);

  const images =
    Array.isArray(project.images) && project.images.length
      ? project.images
      : [project.image].filter(Boolean);

  const mainImage = project.image || images[0] || "";

  const imagesJSON = escapeHTML(
    JSON.stringify([...new Set([mainImage, ...images].filter(Boolean))]),
  );

  const comprises = normalizeComprises(project);

  const comprisesHTML = comprises
    .map(
      (item) => `
        <div class="comprises-item">
          <span class="comprises-icon">${iconSVG(getComprisesIcon(item.title))}</span>
          <span class="comprises-name">${escapeHTML(item.title)}</span>
          ${item.subtitle ? `<span class="comprises-sub">${escapeHTML(item.subtitle)}</span>` : ""}
        </div>
      `,
    )
    .join("");

  const location =
    project.fullAddress ||
    project.projectLocation ||
    project.area ||
    "Location not specified";

  const slug = encodeURIComponent(project.slug || project.id || "");

  return `
    <article class="project-card">

      <!-- Image -->
      <div class="project-gallery">
        <button
          type="button"
          class="project-image-button"
          data-images="${imagesJSON}"
          data-title="${escapeHTML(project.title)}"
          aria-label="View images of ${escapeHTML(project.title)}"
        >
          <img
            class="project-image"
            src="${escapeHTML(mainImage)}"
            alt="${escapeHTML(project.title)}"
            loading="lazy"
            decoding="async"
          >
        </button>

        <span class="project-status ${status.className}">
          ${escapeHTML(status.label)}
        </span>

        <button type="button" class="gallery-trigger">
          ${iconSVG("image")}
          <span>View Gallery</span>
          <span class="circle-arrow">${iconSVG("arrow")}</span>
        </button>
      </div>

      <!-- Info -->
      <div class="project-info">

        <div class="project-info-top">
          <div class="project-overview">
            <div class="project-eyebrow">Project Type</div>
            <h2 class="project-title">${escapeHTML(project.title)}</h2>
            ${
              project.projectDescription
                ? `<p class="project-description">${escapeHTML(project.projectDescription)}</p>`
                : ""
            }
          </div>

          <div class="project-value">
            <div class="project-value-head">
              ${iconSVG("coins")}
              <span class="project-value-label">Project Value</span>
            </div>
            <div class="project-value-amount">
              ${escapeHTML(formatValue(project.projectValue))}
            </div>
          </div>
        </div>

        ${
          comprises.length
            ? `
              <h3 class="project-comprises-title">Project comprises of</h3>
              <div class="project-comprises" style="--count:${comprises.length}">
                ${comprises.length > 1 ? waveSVG() : ""}
                ${comprisesHTML}
              </div>
            `
            : ""
        }

        <div class="project-parties">
          <div class="project-party">
            <span class="project-meta-icon">${iconSVG("users")}</span>
            <div class="project-party-content">
              <span class="project-party-label">Client</span>
              <div class="project-party-value">${escapeHTML(formatValue(project.client))}</div>
            </div>
          </div>

          <div class="project-party">
            <span class="project-meta-icon">${iconSVG("document")}</span>
            <div class="project-party-content">
              <span class="project-party-label">Consultant</span>
              <div class="project-party-value">${escapeHTML(formatValue(project.consultant))}</div>
            </div>
          </div>

          <div class="project-party">
            <span class="project-meta-icon">${iconSVG("map")}</span>
            <div class="project-party-content">
              <span class="project-party-label">Location</span>
              <div class="project-party-value">${escapeHTML(location)}</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Footer -->
      <div class="project-footer">
        <div class="project-footer-meta">
          <div class="project-footer-item">
            <span class="footer-icon">${iconSVG("document")}</span>
            <div class="footer-text">
              <strong>${escapeHTML(formatValue(project.projectNumber))}</strong>
              <span>Project No.</span>
            </div>
          </div>

          <div class="project-footer-item">
            <span class="footer-icon">${iconSVG("calendar")}</span>
            <div class="footer-text">
              <strong>${escapeHTML(formatValue(project.startDate))}</strong>
              <span>Started</span>
            </div>
          </div>

          <div class="project-footer-item">
            <span class="footer-icon">${iconSVG("calendar")}</span>
            <div class="footer-text">
              <strong>${escapeHTML(formatValue(project.completionDate))}</strong>
              <span>Completed</span>
            </div>
          </div>
        </div>

        <div class="footer-cta">
          <a class="project-details-link" href="project-details.html?slug=${slug}">
            <span>View Project Details</span>
            <span class="circle-arrow">${iconSVG("arrow")}</span>
          </a>
        </div>
      </div>

    </article>
  `;
}

/* =========================================
   SEARCH, FILTER AND SORT
========================================= */

function applyFilters() {
  const search = normalizeText(projectSearch.value);
  const type = normalizeText(projectTypeFilter.value);
  const status = normalizeText(projectStatusFilter.value);
  const location = normalizeText(projectLocationFilter.value);

  filteredProjects = allProjects.filter((project) => {
    const searchable = normalizeText(
      [
        project.projectNumber,
        project.title,
        project.slug,
        project.client,
        project.consultant,
        project.projectLocation,
        project.fullAddress,
        project.area,
        project.projectType,
        project.projectDescription,
        project.status,
      ].join(" "),
    );

    const projectStatus = normalizeText(getStatusConfig(project.status).label);
    const projectLocation = normalizeText(project.projectLocation || project.area);

    return (
      (!search || searchable.includes(search)) &&
      (!type || normalizeText(project.projectType) === type) &&
      (!status || projectStatus === status) &&
      (!location || projectLocation === location)
    );
  });

  switch (projectSort.value) {
    case "latest":
      filteredProjects.sort((a, b) => parseProjectDate(b.startDate) - parseProjectDate(a.startDate));
      break;
    case "oldest":
      filteredProjects.sort((a, b) => parseProjectDate(a.startDate) - parseProjectDate(b.startDate));
      break;
    case "title":
      filteredProjects.sort((a, b) => String(a.title || "").localeCompare(String(b.title || "")));
      break;
  }

  currentPage = 1;
  renderProjects();
}

/* =========================================
   RENDER
========================================= */

function renderProjects() {
  const totalPages = Math.ceil(filteredProjects.length / PROJECTS_PER_PAGE);

  if (totalPages && currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PROJECTS_PER_PAGE;
  const pageProjects = filteredProjects.slice(start, start + PROJECTS_PER_PAGE);

  projectsList.innerHTML = pageProjects.length
    ? pageProjects.map(projectCard).join("")
    : "";

  projectsEmpty.hidden = filteredProjects.length !== 0;
  projectsPagination.innerHTML = "";

  if (filteredProjects.length) renderPagination(totalPages);
}

/* =========================================
   PAGINATION
========================================= */

function renderPagination(totalPages) {
  if (totalPages <= 1) return;

  function addButton(label, page, options = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "page-button" + (options.active ? " active" : "");
    button.textContent = label;
    button.disabled = Boolean(options.disabled);

    if (options.active) button.setAttribute("aria-current", "page");

    button.addEventListener("click", () => {
      currentPage = page;
      renderProjects();
      document.getElementById("projects").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    projectsPagination.appendChild(button);
  }

  addButton("‹", Math.max(1, currentPage - 1), { disabled: currentPage === 1 });

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  let previousPage = 0;

  [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b)
    .forEach((page) => {
      if (previousPage && page - previousPage > 1) {
        const dots = document.createElement("span");
        dots.className = "page-ellipsis";
        dots.textContent = "…";
        projectsPagination.appendChild(dots);
      }
      addButton(String(page), page, { active: page === currentPage });
      previousPage = page;
    });

  addButton("›", Math.min(totalPages, currentPage + 1), { disabled: currentPage === totalPages });
}

/* =========================================
   CLEAR FILTERS
========================================= */

function resetFilters() {
  projectSearch.value = "";
  projectTypeFilter.value = "";
  projectStatusFilter.value = "";
  projectLocationFilter.value = "";
  projectSort.value = "default";

  currentPage = 1;
  applyFilters();
}

clearFilters.addEventListener("click", resetFilters);
emptyClearFilters.addEventListener("click", resetFilters);

[projectSearch, projectTypeFilter, projectStatusFilter, projectLocationFilter, projectSort].forEach(
  (control) => {
    control.addEventListener(control === projectSearch ? "input" : "change", applyFilters);
  },
);

/* =========================================
   LIGHTBOX
========================================= */

function showLightboxImage() {
  if (!lightboxImages.length) return;

  lightboxIndex = (lightboxIndex + lightboxImages.length) % lightboxImages.length;

  lightboxImage.src = lightboxImages[lightboxIndex].src;
  lightboxImage.alt = lightboxImages[lightboxIndex].alt;
  lightboxCaption.textContent = lightboxImages[lightboxIndex].alt;

  const multiple = lightboxImages.length > 1;
  lightboxPrev.hidden = !multiple;
  lightboxNext.hidden = !multiple;
}

function openLightbox(images, startIndex = 0) {
  if (!images.length) return;

  previousFocus = document.activeElement;
  lightboxImages = images;
  lightboxIndex = startIndex;

  showLightboxImage();

  lightbox.classList.add("is-open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  lightboxImage.src = "";
  lightboxImages = [];

  if (previousFocus && previousFocus.isConnected) previousFocus.focus();
}

lightboxClose.addEventListener("click", closeLightbox);

lightboxPrev.addEventListener("click", () => {
  lightboxIndex--;
  showLightboxImage();
});

lightboxNext.addEventListener("click", () => {
  lightboxIndex++;
  showLightboxImage();
});

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (!lightbox.classList.contains("is-open")) return;

  if (event.key === "Escape") closeLightbox();
  else if (event.key === "ArrowLeft") { lightboxIndex--; showLightboxImage(); }
  else if (event.key === "ArrowRight") { lightboxIndex++; showLightboxImage(); }
});

/* Clicking the image or "View Gallery" opens the lightbox */

projectsList.addEventListener("click", (event) => {
  const gallery = event.target.closest(".project-gallery");
  if (!gallery) return;

  const imageButton = gallery.querySelector(".project-image-button");
  if (!imageButton) return;

  let images;
  try {
    images = JSON.parse(imageButton.dataset.images || "[]");
  } catch {
    images = [];
  }
  if (!images.length) return;

  const title = imageButton.dataset.title || "Project image";

  openLightbox(images.map((src) => ({ src, alt: title })), 0);
});

/* =========================================
   LOAD PROJECTS JSON
========================================= */

async function loadProjects() {
  try {
    const response = await fetch(PROJECTS_JSON_URL, { cache: "no-cache" });

    if (!response.ok) {
      throw new Error(`Could not load projects: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("The projects JSON must contain an array.");
    }

    allProjects = data.filter((p) => p && typeof p === "object");

    populateFilters();
    applyFilters();
  } catch (error) {
    console.error("Projects loading error:", error);

    projectsList.innerHTML = `
      <div class="projects-loading">
        Unable to load projects. Check the JSON file path and format.
      </div>
    `;
    projectsPagination.innerHTML = "";
  }
}

loadProjects();