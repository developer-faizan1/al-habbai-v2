/* =========================================
   PROJECTS CONFIGURATION
========================================= */

const PROJECTS_JSON_URL = "assets/js/projectsData.json";
const PROJECTS_PER_PAGE = 9;

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

let allProjects = [];
let filteredProjects = [];
let currentPage = 1;

/* =========================================
   HELPERS
========================================= */

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
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

function formatValue(value) {
  return textValue(value, "Not specified");
}

function uniqueValues(projects, key) {
  return [
    ...new Set(
      projects
        .map((project) => String(project[key] ?? "").trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));
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

    arrow:
      '<path d="M5 12h14m-6-6 6 6-6 6"/>',

    coins:
      '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v4c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 10v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/><path d="M5 14v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4"/>',
  };

  return `
    <svg viewBox="0 0 24 24"
         aria-hidden="true"
         focusable="false">
      ${icons[name] || icons.document}
    </svg>
  `;
}

/* =========================================
   PROJECT STATUS
========================================= */

function getStatusConfig(status) {
  const key = normalizeText(status);

  if (key.includes("complete")) {
    return {
      label: "Completed",
      className: "status-completed",
    };
  }

  if (
    key.includes("upcoming") ||
    key.includes("planned") ||
    key.includes("future") ||
    key.includes("not started")
  ) {
    return {
      label: "Upcoming",
      className: "status-upcoming",
    };
  }

  return {
    label: "Running",
    className: "status-running",
  };
}

/* =========================================
   DATE HELPERS
========================================= */

function parseProjectDate(value) {
  if (!value) return 0;

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.getTime();
  }

  const match = String(value)
    .trim()
    .match(/^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/);

  if (!match) return 0;

  const months = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };

  const month = months[match[2].toLowerCase()];

  if (month === undefined) return 0;

  return new Date(
    Number(match[3]),
    month,
    Number(match[1]),
  ).getTime();
}

/* =========================================
   FILTER OPTIONS
========================================= */

function populateSelect(select, values, defaultLabel) {
  if (!select) return;

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

  if (values.includes(previousValue)) {
    select.value = previousValue;
  }
}

function populateFilters() {
  populateSelect(
    projectTypeFilter,
    uniqueValues(allProjects, "projectType"),
    "All Types",
  );

  const statusOptions = ["Completed", "Running"];

  if (
    allProjects.some(
      (project) =>
        getStatusConfig(project.status).label === "Upcoming",
    )
  ) {
    statusOptions.push("Upcoming");
  }

  populateSelect(
    projectStatusFilter,
    statusOptions,
    "All Status",
  );

  const locations = [
    ...new Set(
      allProjects
        .map((project) =>
          String(
            project.projectLocation ?? project.area ?? "",
          ).trim(),
        )
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b));

  populateSelect(
    projectLocationFilter,
    locations,
    "All Locations",
  );
}

/* =========================================
   PROJECT COMPRISES
========================================= */

function getComprisesIcon(title) {
  const value = normalizeText(title);

  if (value.includes("roof")) return "roof";

  if (value.includes("ground floor")) {
    return "home";
  }

  if (
    value.includes("basement") ||
    value.includes("under ground") ||
    value.includes("underground")
  ) {
    return "layers";
  }

  return "building";
}

function getComprisesSubtitle(title, project) {
  const value = normalizeText(title);

  if (value.includes("roof")) return "Top Level";

  if (value.includes("ground floor")) {
    return "Ground Level";
  }

  if (
    value.includes("basement") ||
    value.includes("under ground") ||
    value.includes("underground")
  ) {
    return "Below Ground";
  }

  if (value.includes("podium")) return "Podium Level";

  if (value.includes("parking")) return "Parking Level";

  if (/\bfloors?\b/.test(value)) {
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
        const title = String(
          item.title ?? item.name ?? "",
        ).trim();

        return {
          title,
          subtitle:
            String(item.subtitle ?? "").trim() ||
            getComprisesSubtitle(title, project),
        };
      }

      const title = String(item ?? "").trim();

      return {
        title,
        subtitle: getComprisesSubtitle(title, project),
      };
    })
    .filter((item) => item.title)
    .slice(0, 4);
}

/* =========================================
   PROJECT IMAGE CAROUSEL HTML
========================================= */

function getProjectImages(project) {
  return [
    ...new Set(
      [
        project.image,
        ...(Array.isArray(project.images) ? project.images : []),
      ].filter(Boolean),
    ),
  ];
}

function carouselHTML(project, images, status, index = 0) {
  const title = escapeHTML(project.title);
  const firstImage = images[0] || "";

  const projectNumber = String(
    project.projectNumber ?? "",
  ).trim();

  return `
    <div class="project-gallery" data-carousel>

      <div class="project-carousel-track">
        <img
          class="project-image"
          src="${escapeHTML(firstImage)}"
          alt="${title}"
          width="1200"
          height="900"
          loading="${index < 3 ? "eager" : "lazy"}"
          decoding="async"
          draggable="false"
        >
      </div>

      <span class="project-status ${status.className}">
        ${escapeHTML(status.label)}
      </span>

      ${
        images.length > 1
          ? `
            <span class="pc-counter" aria-hidden="true">
              <span class="pc-counter-current">1</span>&nbsp;/&nbsp;${images.length}
            </span>
          `
          : ""
      }

      ${
        projectNumber
          ? `<span class="pc-ref">No. ${escapeHTML(projectNumber)}</span>`
          : ""
      }

      ${
        images.length > 1
          ? `
            <button
              type="button"
              class="carousel-arrow carousel-prev"
              aria-label="Previous image">
              &#8249;
            </button>

            <button
              type="button"
              class="carousel-arrow carousel-next"
              aria-label="Next image">
              &#8250;
            </button>

            <div class="carousel-dots"
                 aria-label="Project image navigation">

              ${images
                .map(
                  (_, dotIndex) => `
                    <button
                      type="button"
                      class="carousel-dot${dotIndex === 0 ? " is-active" : ""}"
                      data-slide="${dotIndex}"
                      aria-label="Show image ${dotIndex + 1}"
                      aria-pressed="${dotIndex === 0}">
                    </button>
                  `,
                )
                .join("")}

            </div>
          `
          : ""
      }

      <script type="application/json" class="carousel-images">${JSON.stringify(images).replace(/</g, "\\u003c")}</script>

    </div>
  `;
}

/* =========================================
   PROJECT CARD
   NO FOOTER
   NO GALLERY POPUP
========================================= */

function projectCard(project, index = 0) {
  const status = getStatusConfig(project.status);
  const images = getProjectImages(project);
  const comprises = normalizeComprises(project);

  const projectType =
    String(project.projectType ?? "").trim() || "Project";

  const stepsHTML = comprises
    .map(
      (item, stepIndex) => `
        <li class="pc-step" style="--i:${stepIndex}">

          <span class="pc-step-icon">
            ${iconSVG(getComprisesIcon(item.title))}
          </span>

          <span class="pc-step-text">
            <span class="pc-step-name">${escapeHTML(item.title)}</span>
            ${
              item.subtitle
                ? `<span class="pc-step-sub">${escapeHTML(item.subtitle)}</span>`
                : ""
            }
          </span>

        </li>
      `,
    )
    .join("");

  const location =
    project.fullAddress ||
    project.projectLocation ||
    project.area ||
    "Location not specified";

  /*
   * PROJECT SLUG
   * Prefer the slug from JSON.
   * Fall back to the project ID if no slug exists.
   */
  const projectSlug = String(
    project.slug ?? project.id ?? "",
  ).trim();

  const slug = encodeURIComponent(projectSlug);

  return `
    <article class="project-card">

      ${carouselHTML(project, images, status, index)}

      <div class="project-info">

        <header class="pc-rise" style="--d:0">
          <div class="project-eyebrow">
            <span>${escapeHTML(projectType)}</span>
          </div>

          <h2 class="project-title">
            ${escapeHTML(textValue(project.title, "Untitled project"))}
          </h2>
        </header>

        ${
          comprises.length
            ? `
              <div class="pc-rise" style="--d:1" aria-label="Project comprises of">
                <h3 class="pc-section-title">Project comprises of</h3>

                <ol class="pc-timeline" style="--count:${comprises.length}">
                  ${stepsHTML}
                </ol>
              </div>
            `
            : ""
        }

        ${
          projectSlug
            ? `
              <div class="pc-cta-wrap pc-rise" style="--d:2">
                <a
                  class="pc-cta"
                  href="project-details.html?slug=${slug}"
                  aria-label="View project details: ${escapeHTML(project.title)}">
                  <span>View Project Details</span>

                  <span class="pc-cta-arrow">
                    ${iconSVG("arrow")}
                  </span>
                </a>
              </div>
            `
            : ""
        }

      </div>

    </article>
  `;
}

/* =========================================
   SEARCH, FILTER AND SORT
========================================= */

function applyFilters() {
  const search = normalizeText(projectSearch?.value);
  const type = normalizeText(projectTypeFilter?.value);
  const status = normalizeText(projectStatusFilter?.value);
  const location = normalizeText(projectLocationFilter?.value);

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

    const projectStatus = normalizeText(
      getStatusConfig(project.status).label,
    );

    const projectLocation = normalizeText(
      project.projectLocation || project.area,
    );

    return (
      (!search || searchable.includes(search)) &&
      (!type || normalizeText(project.projectType) === type) &&
      (!status || projectStatus === status) &&
      (!location || projectLocation === location)
    );
  });

  switch (projectSort?.value) {
    case "latest":
      filteredProjects.sort(
        (a, b) =>
          parseProjectDate(b.startDate) -
          parseProjectDate(a.startDate),
      );
      break;

    case "oldest":
      filteredProjects.sort(
        (a, b) =>
          parseProjectDate(a.startDate) -
          parseProjectDate(b.startDate),
      );
      break;

    case "title":
      filteredProjects.sort((a, b) =>
        String(a.title || "").localeCompare(
          String(b.title || ""),
        ),
      );
      break;
  }

  currentPage = 1;
  renderProjects();
}

/* =========================================
   SCROLL REVEAL (IntersectionObserver)
========================================= */

let revealObserver = null;

function observeCards() {
  if (!projectsList) return;

  const cards = projectsList.querySelectorAll(".project-card");

  revealObserver?.disconnect();

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reduceMotion || !("IntersectionObserver" in window)) {
    cards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.12,
      rootMargin: "0px 0px -40px 0px",
    },
  );

  cards.forEach((card, index) => {
    // stagger by column position so each row cascades left to right
    card.style.setProperty("--col", String(index % 3));
    revealObserver.observe(card);
  });
}

/* =========================================
   RENDER PROJECTS
========================================= */

function renderProjects() {
  const totalPages = Math.ceil(
    filteredProjects.length / PROJECTS_PER_PAGE,
  );

  if (totalPages && currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * PROJECTS_PER_PAGE;

  const pageProjects = filteredProjects.slice(
    start,
    start + PROJECTS_PER_PAGE,
  );

  if (projectsList) {
    projectsList.innerHTML = pageProjects.length
      ? pageProjects.map(projectCard).join("")
      : "";

    observeCards();
  }

  if (projectsEmpty) {
    projectsEmpty.hidden = filteredProjects.length !== 0;
  }

  if (projectsPagination) {
    projectsPagination.innerHTML = "";

    if (filteredProjects.length) {
      renderPagination(totalPages);
    }
  }
}

/* =========================================
   PAGINATION
========================================= */

function renderPagination(totalPages) {
  if (!projectsPagination || totalPages <= 1) return;

  function addButton(label, page, options = {}) {
    const button = document.createElement("button");

    button.type = "button";
    button.className =
      "page-button" + (options.active ? " active" : "");

    button.textContent = label;
    button.disabled = Boolean(options.disabled);

    if (options.active) {
      button.setAttribute("aria-current", "page");
    }

    button.addEventListener("click", () => {
      currentPage = page;
      renderProjects();

      document.getElementById("projects")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    projectsPagination.appendChild(button);
  }

  addButton("‹", Math.max(1, currentPage - 1), {
    disabled: currentPage === 1,
  });

  const pages = new Set([
    1,
    totalPages,
    currentPage,
    currentPage - 1,
    currentPage + 1,
  ]);

  let previousPage = 0;

  [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b)
    .forEach((page) => {
      if (previousPage && page - previousPage > 1) {
        const dots = document.createElement("span");

        dots.className = "page-ellipsis";
        dots.textContent = "…";

        projectsPagination.appendChild(dots);
      }

      addButton(String(page), page, {
        active: page === currentPage,
      });

      previousPage = page;
    });

  addButton("›", Math.min(totalPages, currentPage + 1), {
    disabled: currentPage === totalPages,
  });
}

/* =========================================
   CLEAR FILTERS
========================================= */

function resetFilters() {
  if (projectSearch) projectSearch.value = "";
  if (projectTypeFilter) projectTypeFilter.value = "";
  if (projectStatusFilter) projectStatusFilter.value = "";
  if (projectLocationFilter) projectLocationFilter.value = "";
  if (projectSort) projectSort.value = "default";

  currentPage = 1;
  applyFilters();
}

clearFilters?.addEventListener("click", resetFilters);
emptyClearFilters?.addEventListener("click", resetFilters);

[
  projectSearch,
  projectTypeFilter,
  projectStatusFilter,
  projectLocationFilter,
  projectSort,
]
  .filter(Boolean)
  .forEach((control) => {
    control.addEventListener(
      control === projectSearch ? "input" : "change",
      applyFilters,
    );
  });

/* =========================================
   CAROUSEL CONTROLS
========================================= */

function getCarouselImages(gallery) {
  try {
    return JSON.parse(
      gallery.querySelector(".carousel-images")?.textContent || "[]",
    );
  } catch (error) {
    console.error("Invalid carousel image data:", error);
    return [];
  }
}

function updateCarousel(gallery, index) {
  const images = getCarouselImages(gallery);
  const image = gallery.querySelector(".project-image");

  if (!images.length || !image) return;

  const activeIndex =
    (index + images.length) % images.length;

  gallery.dataset.activeSlide = String(activeIndex);
  image.src = images[activeIndex];

  // soft fade when the image changes
  image.classList.remove("is-swapping");
  void image.offsetWidth;
  image.classList.add("is-swapping");

  const counter = gallery.querySelector(".pc-counter-current");
  if (counter) counter.textContent = String(activeIndex + 1);

  const title =
    gallery
      .closest(".project-card")
      ?.querySelector(".project-title")
      ?.textContent.trim() || "Project";

  image.alt = `${title} — image ${activeIndex + 1}`;

  gallery.querySelectorAll(".carousel-dot").forEach(
    (dot, dotIndex) => {
      const active = dotIndex === activeIndex;

      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-pressed", String(active));
    },
  );
}

projectsList?.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof Element)) return;

  const gallery = target.closest("[data-carousel]");

  if (!gallery) return;

  const currentIndex = Number(
    gallery.dataset.activeSlide || 0,
  );

  if (target.closest(".carousel-prev")) {
    updateCarousel(gallery, currentIndex - 1);
    return;
  }

  if (target.closest(".carousel-next")) {
    updateCarousel(gallery, currentIndex + 1);
    return;
  }

  const dot = target.closest(".carousel-dot");

  if (dot) {
    updateCarousel(
      gallery,
      Number(dot.dataset.slide || 0),
    );
  }
});

/* =========================================
   MOBILE SWIPE
========================================= */

let touchStartX = 0;
let touchStartY = 0;
let touchedGallery = null;

projectsList?.addEventListener(
  "touchstart",
  (event) => {
    const target = event.target;

    if (!(target instanceof Element)) return;

    const gallery = target.closest("[data-carousel]");

    if (!gallery) return;

    touchedGallery = gallery;
    touchStartX = event.changedTouches[0].clientX;
    touchStartY = event.changedTouches[0].clientY;
  },
  { passive: true },
);

projectsList?.addEventListener(
  "touchend",
  (event) => {
    if (!touchedGallery) return;

    const endX = event.changedTouches[0].clientX;
    const endY = event.changedTouches[0].clientY;

    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;

    if (
      Math.abs(deltaX) > 45 &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      const currentIndex = Number(
        touchedGallery.dataset.activeSlide || 0,
      );

      updateCarousel(
        touchedGallery,
        currentIndex + (deltaX < 0 ? 1 : -1),
      );
    }

    touchedGallery = null;
  },
  { passive: true },
);

/* =========================================
   LOAD PROJECT DATA
========================================= */

async function loadProjects() {
  try {
    const response = await fetch(PROJECTS_JSON_URL, {
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(
        `Could not load projects: HTTP ${response.status}`,
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error(
        "The projects JSON must contain an array.",
      );
    }

    allProjects = data.filter(
      (project) => project && typeof project === "object",
    );

    populateFilters();
    applyFilters();
  } catch (error) {
    console.error("Projects loading error:", error);

    if (projectsList) {
      projectsList.innerHTML = `
        <div class="projects-loading">
          Unable to load projects.
          Check the JSON file path and format.
        </div>
      `;
    }

    if (projectsPagination) {
      projectsPagination.innerHTML = "";
    }
  }
}

loadProjects();