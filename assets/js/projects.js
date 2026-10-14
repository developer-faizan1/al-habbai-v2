/* =========================================
   AL HABBAI CONTRACTING
   Dynamic Projects, Filters and Pagination
========================================= */

document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  const JSON_FILE = "./assets/js/projectsData.json";
  const DEFAULT_IMAGE = "./assets/images/projects_img/default.jpg";

  const grid = document.getElementById("projectsGrid");
  const searchInput = document.getElementById("projectSearch");
  const typeFilter = document.getElementById("projectTypeFilter");
  const statusFilter = document.getElementById("projectStatusFilter");
  const locationFilter = document.getElementById("projectLocationFilter");
  const sortFilter = document.getElementById("projectSort");
  const clearButton = document.getElementById("clearProjectFilters");
  const previousButton = document.getElementById("previousProject");
  const nextButton = document.getElementById("nextProject");
  const pagination = document.getElementById("projectPagination");
  const counter = document.getElementById("projectCounter");
  const resultsCount = document.getElementById("projectResultsCount");
  const emptyState = document.getElementById("projectsEmpty");
  const resetEmptyButton = document.getElementById("resetEmptyFilters");

  const CARDS_PER_PAGE = 6;

  let allProjects = [];
  let filteredProjects = [];
  let currentPage = 0;

  /* =========================================
     HELPERS
  ========================================= */

  function normalize(value) {
    return String(value ?? "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function numericProjectNumber(project) {
    const value = String(project.projectNumber ?? project.id ?? "");
    const match = value.match(/\d+/);
    return match ? Number(match[0]) : 0;
  }

  function getProjectLocation(project) {
    return (
      project.projectLocation ||
      project.fullAddress ||
      project.area ||
      project.city ||
      project.state ||
      "Dubai"
    );
  }

  function getDisplayTitle(project) {
    return String(project.title || "Untitled Project")
      .replace(/^\([^)]*\)\s*/, "")
      .replace(/\s+Building$/i, "")
      .trim();
  }

  function getProjectUrl(project) {
    return (
      "project-details.html?slug=" + encodeURIComponent(project.slug || "")
    );
  }

  function isCompleted(project) {
    return normalize(project.status) === "completed";
  }

  function isOngoing(project) {
    const status = normalize(project.status);

    return [
      "ongoing",
      "under construction",
      "underconstruction",
      "in progress",
      "inprogress",
    ].includes(status);
  }

  /* =========================================
     LOAD JSON
  ========================================= */

  async function loadProjects() {
    try {
      const response = await fetch(JSON_FILE);

      if (!response.ok) {
        throw new Error(`Unable to load JSON: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("projectsData.json must contain an array of projects.");
      }

      allProjects = data;

      populateFilters();
      applyFilters();
    } catch (error) {
      console.error("Projects loading error:", error);

      grid.innerHTML = `
        <div class="projects-loading">
          Projects could not be loaded. Please check the JSON file
          path and run the website through a local server.
        </div>
      `;

      resultsCount.textContent = "Unable to load projects";
    }
  }

  /* =========================================
     POPULATE DROPDOWNS
  ========================================= */

  function populateSelect(select, values, defaultText) {
    const uniqueValues = [
      ...new Set(values.filter(Boolean).map((value) => String(value).trim())),
    ].sort((a, b) => a.localeCompare(b));

    select.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = defaultText;
    select.appendChild(defaultOption);

    uniqueValues.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function populateFilters() {
    populateSelect(
      typeFilter,
      allProjects.map((project) => project.projectType),
      "All Types",
    );

    populateSelect(
      statusFilter,
      allProjects.map((project) => project.status),
      "All Status",
    );

    populateSelect(
      locationFilter,
      allProjects.map(getProjectLocation),
      "All Locations",
    );
  }

  /* =========================================
     FILTER PROJECTS
  ========================================= */

  function applyFilters() {
    const query = normalize(searchInput.value);
    const selectedType = normalize(typeFilter.value);
    const selectedStatus = normalize(statusFilter.value);
    const selectedLocation = normalize(locationFilter.value);

    filteredProjects = allProjects.filter((project) => {
      const searchableFields = [
        project.id,
        project.projectNumber,
        project.slug,
        project.title,
        project.projectType,
        project.status,
        project.projectLocation,
        project.fullAddress,
        project.area,
        project.city,
        project.state,
        project.country,
        project.client,
        project.consultant,
        project.projectValue,
        project.projectDescription,
        project.plot,
      ];

      const searchableText = searchableFields
        .filter(Boolean)
        .map(normalize)
        .join(" ");

      const matchesSearch = !query || searchableText.includes(query);

      const matchesType =
        !selectedType || normalize(project.projectType) === selectedType;

      const matchesStatus =
        !selectedStatus || normalize(project.status) === selectedStatus;

      const matchesLocation =
        !selectedLocation ||
        normalize(getProjectLocation(project)) === selectedLocation;

      return matchesSearch && matchesType && matchesStatus && matchesLocation;
    });

    sortProjects();

    currentPage = 0;
    renderProjects();
  }

  /* =========================================
     SORT PROJECTS
  ========================================= */

  
function sortProjects() {
  const sortValue = sortFilter.value;

  switch (sortValue) {
    case "oldest":
    case "number-asc":
      filteredProjects.sort(
        (a, b) => numericProjectNumber(a) - numericProjectNumber(b)
      );
      break;

    case "title-asc":
      filteredProjects.sort((a, b) =>
        getDisplayTitle(a).localeCompare(getDisplayTitle(b))
      );
      break;

    case "title-desc":
      filteredProjects.sort((a, b) =>
        getDisplayTitle(b).localeCompare(getDisplayTitle(a))
      );
      break;

    case "latest":
    case "number-desc":
      filteredProjects.sort(
        (a, b) => numericProjectNumber(b) - numericProjectNumber(a)
      );
      break;

    case "default":
    default:
      // Keep the original order from projectsData.json.
      break;
  }
}


  /* =========================================
     CREATE PROJECT CARD
  ========================================= */

  function createProjectCard(project, index) {
    const id = project.id ?? "";
    const projectNumber = project.projectNumber || `P-${id}`;

    const title = getDisplayTitle(project);
    const projectType = project.projectType || "Project";
    const location = getProjectLocation(project);

    const image = project.image || DEFAULT_IMAGE;

    const description =
      project.projectDescription ||
      "A construction project delivered with a focus on quality, functionality and design.";

    const status = project.status || "Not specified";

    let badgeClass = "";

    if (isCompleted(project)) {
      badgeClass = "completed";
    } else if (isOngoing(project)) {
      badgeClass = "ongoing";
    }

    const value = project.projectValue || "Not specified";
    const client = project.client || "Not specified";
    const startDate = project.startDate || "Not specified";
    const completionDate = project.completionDate || "Not specified";

    // Use the project description for the construction
    // configuration when the title contains a building code.
    const configurationMatch = String(project.title || "").match(
      /^\(([^)]+)\)/,
    );

    const configuration = configurationMatch ? configurationMatch[1] : "";

    return `
      <article
        class="project-card"
        data-project-id="${escapeHTML(String(id))}"
        style="animation-delay:${Math.min(index, 7) * 45}ms"
      >

        <!-- INFORMATION PANEL AND BUILDING IMAGE -->

        <div class="project-card-visual">

          <div class="project-info-panel">

            <span class="project-label">Project</span>

            <div class="project-big-number">
              ${escapeHTML(String(id || projectNumber))}
            </div>

            <div class="project-info-item">
              <strong>Project Number</strong>
              <span>${escapeHTML(projectNumber)}</span>
            </div>

            ${configuration
        ? `
                  <div class="project-info-item">
                    <strong>Project Comprises Of</strong>
                    <span>${escapeHTML(configuration)}</span>
                  </div>
                `
        : ""
      }

            <div class="project-info-item">
              <strong>Project Value</strong>
              <span>${escapeHTML(value)}</span>
            </div>

            <div class="project-info-item">
              <strong>Client</strong>
              <span>${escapeHTML(client)}</span>
            </div>

            <div class="project-info-item">
              <strong>Started On</strong>
              <span>${escapeHTML(startDate)}</span>
            </div>

            <div class="project-info-item">
              <strong>Completed On</strong>
              <span>${escapeHTML(completionDate)}</span>
            </div>

          </div>

          <div class="project-image">

            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(title)}"
              loading="${index < 4 ? "eager" : "lazy"}"
              onerror="this.onerror=null;this.src='${escapeHTML(DEFAULT_IMAGE)}';"
            >

            <span class="project-badge ${badgeClass}">
              ${escapeHTML(status)}
            </span>

          </div>

        </div>

        <!-- TITLE AND DESCRIPTION -->

        <div class="project-card-content">

          <span class="project-card-type">
            ${escapeHTML(projectType)} Development
          </span>

          <h3 class="project-card-title">
            ${escapeHTML(title)}
          </h3>

          <div class="project-card-accent"></div>



          <div class="project-card-footer">

             <a href="./map.html">
                <svg
                  class="project__map"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </a>

            <button
              type="button"
              class="project-view-link"
              data-project-slug="${escapeHTML(project.slug || "")}"
              aria-label="View details for ${escapeHTML(title)}"
            >
              View Details <span aria-hidden="true">→</span>
            </button>

          </div>

        </div>

      </article>
    `;
  }

  /* =========================================
     RENDER PROJECTS
  ========================================= */

  function renderProjects() {
    const totalProjects = filteredProjects.length;
    const totalPages = Math.ceil(totalProjects / CARDS_PER_PAGE);

    emptyState.hidden = totalProjects !== 0;
    grid.hidden = totalProjects === 0;

    if (totalProjects === 0) {
      grid.innerHTML = "";
      resultsCount.textContent = "0 projects found";
      counter.textContent = "Page 0";
      updatePagination(0);
      return;
    }

    if (currentPage >= totalPages) {
      currentPage = Math.max(0, totalPages - 1);
    }

    const start = currentPage * CARDS_PER_PAGE;
    const visibleProjects = filteredProjects.slice(
      start,
      start + CARDS_PER_PAGE,
    );

    grid.innerHTML = visibleProjects.map(createProjectCard).join("");

    const firstProject = start + 1;
    const lastProject = Math.min(start + visibleProjects.length, totalProjects);

    resultsCount.textContent = `Showing ${firstProject}–${lastProject} of ${totalProjects} projects`;

    counter.textContent = `Page ${currentPage + 1} of ${totalPages}`;

    updatePagination(totalPages);
  }

  /* =========================================
     PAGINATION
  ========================================= */

  function updatePagination(totalPages) {
    previousButton.disabled = currentPage <= 0;
    nextButton.disabled = totalPages === 0 || currentPage >= totalPages - 1;

    pagination.innerHTML = "";

    for (let page = 0; page < totalPages; page++) {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "pagination-page";
      button.textContent = String(page + 1);
      button.setAttribute("aria-label", `Go to page ${page + 1}`);

      if (page === currentPage) {
        button.classList.add("active");
        button.setAttribute("aria-current", "page");
      }

      button.addEventListener("click", () => {
        currentPage = page;
        renderProjects();
        scrollToProjects();
      });

      pagination.appendChild(button);
    }
  }

  function goToPage(page) {
    const totalPages = Math.ceil(filteredProjects.length / CARDS_PER_PAGE);

    if (page < 0 || page >= totalPages) return;

    currentPage = page;
    renderProjects();
    scrollToProjects();
  }

  function scrollToProjects() {
    if (window.innerWidth <= 900) {
      document.querySelector(".projects-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  /* =========================================
     CLEAR FILTERS
  ========================================= */

  function clearAllFilters() {
    searchInput.value = "";
    typeFilter.value = "";
    statusFilter.value = "";
    locationFilter.value = "";
   sortFilter.value = "default";

    applyFilters();
  }

  /* =========================================
     EVENT LISTENERS
  ========================================= */

  let searchTimer;

  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);

    searchTimer = setTimeout(applyFilters, 200);
  });

  typeFilter.addEventListener("change", applyFilters);
  statusFilter.addEventListener("change", applyFilters);
  locationFilter.addEventListener("change", applyFilters);
  sortFilter.addEventListener("change", applyFilters);

  clearButton.addEventListener("click", clearAllFilters);

  resetEmptyButton.addEventListener("click", clearAllFilters);

  previousButton.addEventListener("click", () => {
    goToPage(currentPage - 1);
  });

  nextButton.addEventListener("click", () => {
    goToPage(currentPage + 1);
  });

  // Open the existing project-details page.
  grid.addEventListener("click", (event) => {
    const button = event.target.closest(".project-view-link");

    if (!button) return;

    const slug = button.dataset.projectSlug;

    if (!slug) {
      console.error("This project has no slug.");
      return;
    }

    window.location.href = `project-details.html?slug=${encodeURIComponent(slug)}`;
  });

  /* =========================================
     START
  ========================================= */

  loadProjects();
});
