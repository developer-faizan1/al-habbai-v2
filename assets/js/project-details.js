document.addEventListener("DOMContentLoaded", async () => {
  /* =========================================
       1. CONFIGURATION
    ========================================= */
  // Change this path if your JSON file is elsewhere.
  const PROJECTS_JSON_URL = "./assets/js/projectsData.json";
  /* =========================================
       2. GET PROJECT SLUG
    ========================================= */
  const params = new URLSearchParams(window.location.search);
  const projectSlug = params.get("slug");

  /* =========================================
       3. DOM ELEMENTS
    ========================================= */
  // Left gallery
  const galleryElement = document.querySelector(".project-gallery");
  const mainImage = document.getElementById("mainProjectImage");
  const thumbnailsContainer = document.getElementById("galleryThumbnails");
  const galleryPrev = document.getElementById("galleryPrev");
  const galleryNext = document.getElementById("galleryNext");
  const thumbnailPrev = document.getElementById("thumbnailPrev");
  const thumbnailNext = document.getElementById("thumbnailNext");
  const fullscreenButton = document.getElementById("galleryFullscreen");
  // Fullscreen viewer
  const lightbox = document.getElementById("galleryLightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCounter = document.getElementById("lightboxCounter");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");
  // Right project information
  const titleElement = document.getElementById("projectTitle");
  const breadcrumbElement = document.getElementById("breadcrumbProject");
  const statusElement = document.getElementById("projectStatus");
  const statusTextElement = document.getElementById("projectStatusText");
  const locationElement = document.getElementById("projectLocation");
  const descriptionElement = document.getElementById("projectDescription");
  /* =========================================
       4. GALLERY STATE
    ========================================= */
  let projectImages = [];
  let currentIndex = 0;
  let previousFocus = null;
  /* =========================================
       5. HELPER FUNCTIONS
    ========================================= */
  function setText(id, value, fallback = "Not specified") {
    const element = document.getElementById(id);
    if (!element) return;
    const text =
      value === null || value === undefined ? "" : String(value).trim();
    element.textContent = text || fallback;
  }
  function getFirstValue(...values) {
    for (const value of values) {
      if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
      ) {
        return value;
      }
    }
    return "";
  }
  /* =========================================
       6. LOAD PROJECT FROM JSON
    ========================================= */
  async function loadProject() {
    try {
      if (!projectSlug) {
        throw new Error("Project slug is missing from the URL.");
      }
      const response = await fetch(PROJECTS_JSON_URL);
      if (!response.ok) {
        throw new Error(`Unable to load project data (${response.status}).`);
      }
      const data = await response.json();
      // Support an array or an object containing projects.
      const projects = Array.isArray(data) ? data : data.projects;
      if (!Array.isArray(projects)) {
        throw new Error("Invalid JSON format. Expected a project array.");
      }
      // Find the project selected on the projects page.
      const project = projects.find(
        (item) => String(item.slug || "") === projectSlug,
      );

      if (!project) {
        throw new Error(`Project not found for slug: ${projectSlug}`);
      }
      // Populate right-side project details.
      populateProjectDetails(project);
      // Populate left-side image gallery.
      prepareGallery(project);
    } catch (error) {
      showError(error.message);
    }
  }
  /* =========================================
       7. POPULATE RIGHT-SIDE PROJECT DETAILS
    ========================================= */

  function populateProjectDetails(project) {
    // Browser title
    document.title = `${project.title || "Project Details"} | Projects`;
    // Project title
    setText("projectTitle", project.title, "Untitled Project");
    // Breadcrumb
    setText(
      "breadcrumbProject",
      getFirstValue(project.projectNumber, project.projectCode, project.title),
      "Project",
    );
    // Project status
    const status = String(
      getFirstValue(project.status, "Not specified"),
    ).trim();
    if (statusTextElement) {
      statusTextElement.textContent = status;
    }
    // Apply status classes to the badge.
    if (statusElement) {
      statusElement.classList.remove(
        "status-completed",
        "status-ongoing",
        "status-upcoming",
      );
      const normalizedStatus = status.toLowerCase();
      if (normalizedStatus === "completed") {
        statusElement.classList.add("status-completed");
      } else if (
        normalizedStatus.includes("ongoing") ||
        normalizedStatus.includes("progress")
      ) {
        statusElement.classList.add("status-ongoing");
      } else if (
        normalizedStatus.includes("upcoming") ||
        normalizedStatus.includes("planned")
      ) {
        statusElement.classList.add("status-upcoming");
      }
    }
    // Project location

    // Project location — use only fullAddress
    const location = String(project.fullAddress || "").trim();

    if (locationElement) {
      locationElement.textContent = location || "Location not specified";
    }

    // Project description
    setText(
      "projectDescription",
      project.projectDescription,
      "Project description will be available soon.",
    );
    // Project information cards
    setText("projectValue", project.projectValue);
    setText("projectClient", project.client);
    setText("projectConsultant", project.consultant);
    setText("projectType", project.projectType);
    setText("projectArea", project.area);
    setText("projectPlot", getFirstValue(project.plotNumber, project.plot));
    setText("projectStartDate", project.startDate);
    setText("projectCompletionDate", project.completionDate);
  }
  /* =========================================
       8. NORMALIZE IMAGE DATA
    ========================================= */
  function normalizeImage(item, fallbackAlt) {
    if (typeof item === "string") {
      return {
        src: item.trim(),
        alt: fallbackAlt,
      };
    }
    if (item && typeof item === "object") {
      return {
        src: String(item.src || item.image || item.url || "").trim(),
        alt: item.alt || fallbackAlt,
      };
    }
    return null;
  }
  /* =========================================
       9. PREPARE PROJECT GALLERY
    ========================================= */
  function prepareGallery(project) {
    const fallbackAlt = project.title || "Project image";
    // Main project image.
    const mainImageData = normalizeImage(
      getFirstValue(project.image, project.heroImage, project.thumbnail),
      fallbackAlt,
    );
    // Support both "images" and "gallery".
    const rawImages = Array.isArray(project.images)
      ? project.images
      : Array.isArray(project.gallery)
        ? project.gallery
        : [];
    const additionalImages = rawImages
      .map((item) => normalizeImage(item, fallbackAlt))
      .filter((item) => item && item.src);
    projectImages = [];
    // Show the main image first.
    if (mainImageData && mainImageData.src) {
      projectImages.push(mainImageData);
    }
    // Add gallery images without duplicate paths.
    additionalImages.forEach((image) => {
      const exists = projectImages.some(
        (existing) => existing.src === image.src,
      );
      if (!exists) {
        projectImages.push(image);
      }
    });
    if (projectImages.length === 0) {
      throw new Error("No project images were found in the JSON data.");
    }
    currentIndex = 0;
    renderThumbnails();
    updateGallery(0);
  }
  /* =========================================
       10. RENDER THUMBNAILS
    ========================================= */
  function renderThumbnails() {
    thumbnailsContainer.replaceChildren();
    projectImages.forEach((image, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "thumbnail-item";
      button.dataset.index = String(index);
      button.setAttribute("aria-label", `View image ${index + 1}`);
      button.setAttribute("aria-pressed", "false");
      const img = document.createElement("img");
      img.src = image.src;
      img.alt = image.alt;
      img.loading = index === 0 ? "eager" : "lazy";
      img.decoding = "async";
      button.appendChild(img);
      button.addEventListener("click", () => {
        updateGallery(index);
      });
      thumbnailsContainer.appendChild(button);
    });
  }
  /* =========================================
       11. UPDATE MAIN IMAGE AND COUNTER
    ========================================= */
  function updateGallery(index) {
    if (!projectImages.length) return;
    currentIndex = (index + projectImages.length) % projectImages.length;
    const image = projectImages[currentIndex];
    mainImage.src = image.src;
    mainImage.alt = image.alt;
    // Update active thumbnail.
    const thumbnails = thumbnailsContainer.querySelectorAll(".thumbnail-item");
    thumbnails.forEach((thumbnail, index) => {
      const active = index === currentIndex;
      thumbnail.classList.toggle("active", active);
      thumbnail.setAttribute("aria-pressed", String(active));
    });
    // Keep selected thumbnail visible.
    const activeThumbnail = thumbnails[currentIndex];
    if (activeThumbnail) {
      const containerRect = thumbnailsContainer.getBoundingClientRect();
      const thumbnailRect = activeThumbnail.getBoundingClientRect();
      if (
        thumbnailRect.left < containerRect.left ||
        thumbnailRect.right > containerRect.right
      ) {
        activeThumbnail.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }
    // Synchronize fullscreen viewer.
    if (lightbox.classList.contains("open")) {
      updateLightbox();
    }
  }
  /* =========================================
       12. MAIN IMAGE NAVIGATION
    ========================================= */
  galleryPrev.addEventListener("click", () => {
    updateGallery(currentIndex - 1);
  });
  galleryNext.addEventListener("click", () => {
    updateGallery(currentIndex + 1);
  });
  /* =========================================
       13. THUMBNAIL NAVIGATION
    ========================================= */
  thumbnailPrev.addEventListener("click", () => {
    thumbnailsContainer.scrollBy({
      left: -thumbnailsContainer.clientWidth * 0.75,
      behavior: "smooth",
    });
  });
  thumbnailNext.addEventListener("click", () => {
    thumbnailsContainer.scrollBy({
      left: thumbnailsContainer.clientWidth * 0.75,
      behavior: "smooth",
    });
  });
  /* =========================================
       14. FULLSCREEN IMAGE VIEWER
    ========================================= */
  function updateLightbox() {
    if (!projectImages.length) return;
    const image = projectImages[currentIndex];
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightboxCounter.textContent =
      `${String(currentIndex + 1).padStart(2, "0")} / ` +
      `${String(projectImages.length).padStart(2, "0")}`;
  }
  function openLightbox() {
    if (!projectImages.length) return;
    previousFocus = document.activeElement;
    updateLightbox();
    lightbox.inert = false;
    lightbox.setAttribute("aria-hidden", "false");
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
    lightboxClose.focus();
  }
  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    lightbox.inert = true;
    document.body.style.overflow = "";
    if (previousFocus && previousFocus.isConnected) {
      previousFocus.focus();
    }
  }
  fullscreenButton.addEventListener("click", openLightbox);
  lightboxClose.addEventListener("click", closeLightbox);
  lightboxPrev.addEventListener("click", () => {
    updateGallery(currentIndex - 1);
  });
  lightboxNext.addEventListener("click", () => {
    updateGallery(currentIndex + 1);
  });

  /* =========================================
       15. CLOSE LIGHTBOX ON BACKGROUND CLICK
    ========================================= */
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
  /* =========================================
       16. KEYBOARD NAVIGATION
    ========================================= */

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("open")) {
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      updateGallery(currentIndex - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      updateGallery(currentIndex + 1);
    }
  });
  /* =========================================
       17. ERROR HANDLING
    ========================================= */
  function showError(message) {
    if (titleElement) {
      titleElement.textContent = message;
    }
    if (galleryElement) {
      galleryElement.hidden = true;
    }
    if (descriptionElement) {
      descriptionElement.textContent = "";
    }
  }

  /* =========================================
       18. INITIALIZE PAGE
    ========================================= */
  await loadProject();
});

// counter
async (params) => {
  if (!flag) {
    return function () {
      console.log("Errors are coming from Backend");
    };
  } else {
    return function (msg, userDetails) {
      for (msg in ele) {
        console.log(postMessage);
      }
    };
  }
};
