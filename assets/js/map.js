/* ============================================================
   AL HABBAI CONTRACTING
   CURRENT PROJECTS LOCATION MAP
============================================================ */

const DATA_URL = "./assets/js/projectsData.json";


/* ============================================================
   STATE
============================================================ */

const state = {
  projects: [],
  markers: new Map(),
  activeProject: null,
  satellite: false
};


/* ============================================================
   DOM HELPER
============================================================ */

const $ = (id) => document.getElementById(id);


/* ============================================================
   MAP
============================================================ */

const map = L.map("map", {
  zoomControl: true,
  minZoom: 9,
  maxZoom: 19,
  scrollWheelZoom: true,
  zoomSnap: 0.5,
  zoomDelta: 0.5
}).setView([25.2048, 55.2708], 11);


/* ============================================================
   MAP SIZE
============================================================ */

function refreshMapSize(delay = 100) {
  setTimeout(() => {
    map.invalidateSize(true);
  }, delay);
}

window.addEventListener("resize", () => {
  refreshMapSize(100);
});


/* ============================================================
   STREET MAP
============================================================ */

const streetLayer = L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }
);


/* ============================================================
   SATELLITE MAP
============================================================ */

const satelliteLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution: "Tiles &copy; Esri"
  }
);


/* ============================================================
   DEFAULT MAP
============================================================ */

streetLayer.addTo(map);


/* ============================================================
   CHECK COORDINATES
============================================================ */

function hasCoords(project) {
  const lat = Number(project?.latitude);
  const lng = Number(project?.longitude);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}


/* ============================================================
   PROJECT IMAGE
============================================================ */

function safeImage(project) {
  return (
    project?.image ||
    (
      Array.isArray(project?.images)
        ? project.images[0]
        : ""
    ) ||
    ""
  );
}


/* ============================================================
   GOOGLE MAPS URL
============================================================ */

function mapsUrl(project) {
  if (hasCoords(project)) {
    return (
      "https://www.google.com/maps/search/" +
      "?api=1&query=" +
      project.latitude +
      "," +
      project.longitude
    );
  }

  return (
    "https://www.google.com/maps/search/" +
    "?api=1&query=" +
    encodeURIComponent(
      project.fullAddress ||
      project.projectLocation ||
      project.title ||
      ""
    )
  );
}





/* ============================================================
   ESCAPE HTML
============================================================ */

function esc(value) {
  return String(value ?? "—")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* ============================================================
   CHECK RUNNING PROJECT
============================================================ */

function isRunning(project) {
  const status = String(project?.status || "").toLowerCase();

  return (
    status.includes("running") ||
    status.includes("ongoing") ||
    status.includes("construction")
  );
}


/* ============================================================
   MARKER ICON
============================================================ */

function markerIcon(project) {
  const number = String(
    project?.projectNumber || ""
  ).replace("P-", "");

  const running = isRunning(project);

  return L.divIcon({
    className: "project-marker-wrapper",

    html: `
      <div class="custom-pin ${running ? "running" : ""}">
        
        <div class="pin-shape"></div>

        <div class="pin-letter">
          ${esc(number)}
        </div>

        <div class="pin-label">
          ${esc(project?.projectNumber || "")}
        </div>

      </div>
    `,

    iconSize: [90, 55],
    iconAnchor: [45, 28],
    popupAnchor: [0, -25]
  });
}


/* ============================================================
   POPUP
============================================================ */

function popupHtml(project) {
  return `
    <div class="popup">

      <img
        src="${esc(safeImage(project))}"
        alt="${esc(project.title)}"
        onerror="this.style.display='none'"
      >

      <div class="popup-body">

        <div class="popup-number">
          ${esc(project.projectNumber)}
        </div>

        <div class="popup-title">
          ${esc(project.title)}
        </div>

        <div class="popup-location">
          ⌖
          ${esc(
            project.projectLocation ||
            project.area ||
            project.fullAddress ||
            "Dubai"
          )}
        </div>

        <div class="popup-actions">

          <button
            type="button"
            data-open-project="${esc(project.id)}"
          >
            View Details
          </button>

          <a
            href="${mapsUrl(project)}"
            target="_blank"
            rel="noopener"
          >
            Google Maps
          </a>

        </div>

      </div>

    </div>
  `;
}


/* ============================================================
   CREATE MARKERS
============================================================ */

function createMarkers() {

  // Remove existing markers
  state.markers.forEach((marker) => {
    marker.remove();
  });

  state.markers.clear();


  // Only projects with valid coordinates
  state.projects
    .filter(hasCoords)
    .forEach((project) => {

      const marker = L.marker(
        [
          Number(project.latitude),
          Number(project.longitude)
        ],
        {
          icon: markerIcon(project),

          title:
            project.projectNumber ||
            project.title ||
            "Project"
        }
      ).addTo(map);


      marker.bindPopup(
        popupHtml(project),
        {
          maxWidth: 290,
          closeButton: true
        }
      );


      marker.on("click", () => {
        state.activeProject = project;
      });


      state.markers.set(
        String(project.id),
        marker
      );
    });
}


/* ============================================================
   FOCUS PROJECT
============================================================ */

function focusProject(project) {

  if (!hasCoords(project)) {
    showToast("Exact coordinates are not available.");
    return;
  }

  const marker = state.markers.get(
    String(project.id)
  );

  if (!marker) {
    return;
  }

  map.invalidateSize(true);

  map.flyTo(
    [
      Number(project.latitude),
      Number(project.longitude)
    ],
    15,
    {
      duration: 1.1
    }
  );

  setTimeout(() => {
    marker.openPopup();
  }, 700);
}


/* ============================================================
   FIT ALL PROJECTS
   Automatically used on page load
============================================================ */

function fitAll() {

  // Projects with null coordinates are automatically ignored
  const projects = state.projects.filter(hasCoords);

  if (!projects.length) {
    showToast(
      "No projects with coordinates found."
    );

    return;
  }

  map.invalidateSize(true);


  /* ----------------------------------------------------------
     ONE PROJECT
  ---------------------------------------------------------- */

  if (projects.length === 1) {

    const project = projects[0];

    map.setView(
      [
        Number(project.latitude),
        Number(project.longitude)
      ],
      14,
      {
        animate: false
      }
    );

    return;
  }


  /* ----------------------------------------------------------
     MULTIPLE PROJECTS
  ---------------------------------------------------------- */

  const bounds = L.latLngBounds(
    projects.map((project) => [
      Number(project.latitude),
      Number(project.longitude)
    ])
  );


  if (!bounds.isValid()) {

    showToast(
      "No valid coordinates found."
    );

    return;
  }


  setTimeout(() => {

    map.fitBounds(
      bounds,
      {
        paddingTopLeft: [110, 90],
        paddingBottomRight: [110, 90],
        maxZoom: 13,
        animate: false
      }
    );

  }, 150);
}


/* ============================================================
   DETAILS PANEL
============================================================ */

function openDetails(project) {

  state.activeProject = project;

  $("detailsNumber").textContent =
    project.projectNumber || "PROJECT";


  $("detailsImage").src =
    safeImage(project);

  $("detailsImage").alt =
    project.title || "Project";


  $("detailsStatus").textContent =
    project.status || "Status";


  $("detailsType").textContent =
    project.projectType || "Project";


  $("detailsTitle").textContent =
    project.title || "Project";


  $("detailsDescription").textContent =
    project.projectDescription ||
    "Project details";


  $("detailsValue").textContent =
    project.projectValue || "—";


  $("detailsLocation").textContent =
    project.projectLocation ||
    project.area ||
    "—";


  $("detailsClient").textContent =
    project.client || "—";


  $("detailsConsultant").textContent =
    project.consultant || "—";


  $("detailsStart").textContent =
    project.startDate || "—";


  $("detailsCompletion").textContent =
    project.completionDate || "—";


  $("detailsPlot").textContent =
    project.plot || "—";


  $("detailsAddress").textContent =
    project.fullAddress || "—";


  /* Google Maps button */
  $("googleMapsBtn").href =
    mapsUrl(project);


  /* Open details panel */
  $("detailsPanel").classList.add("open");

  $("detailsBackdrop").classList.add("open");

  $("detailsPanel").setAttribute(
    "aria-hidden",
    "false"
  );
}


/* ============================================================
   CLOSE DETAILS
============================================================ */

function closeDetails() {

  $("detailsPanel").classList.remove("open");

  $("detailsBackdrop").classList.remove("open");

  $("detailsPanel").setAttribute(
    "aria-hidden",
    "true"
  );
}


/* ============================================================
   SATELLITE
============================================================ */

function toggleSatellite() {

  state.satellite = !state.satellite;


  if (state.satellite) {

    if (map.hasLayer(streetLayer)) {
      map.removeLayer(streetLayer);
    }

    satelliteLayer.addTo(map);

    $("satelliteBtn").innerHTML =
      "<span>▦</span> Street Map";

  } else {

    if (map.hasLayer(satelliteLayer)) {
      map.removeLayer(satelliteLayer);
    }

    streetLayer.addTo(map);

    $("satelliteBtn").innerHTML =
      "<span>◈</span> Satellite";
  }

  refreshMapSize(150);
}


/* ============================================================
   TOAST
============================================================ */

function showToast(message) {

  const toast = $("toast");

  if (!toast) {
    return;
  }

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}


/* ============================================================
   LOAD JSON
============================================================ */

async function loadProjects() {

  const response = await fetch(
    DATA_URL,
    {
      cache: "no-store"
    }
  );


  if (!response.ok) {

    throw new Error(
      `Unable to load projectsData.json: HTTP ${response.status}`
    );
  }


  const data = await response.json();


  if (!Array.isArray(data)) {

    throw new Error(
      "projectsData.json must contain an array."
    );
  }


  return data;
}


/* ============================================================
   INITIALIZE
============================================================ */

async function init() {

  try {

    if (typeof L === "undefined") {

      throw new Error(
        "Leaflet did not load."
      );
    }


    if (location.protocol === "file:") {

      throw new Error(
        "Please run the website using VS Code Live Server."
      );
    }


    // Load projects
    state.projects =
      await loadProjects();


    // Create markers
    createMarkers();


    // Fix map size
    refreshMapSize(100);


    // Automatically show all projects
    // that have valid latitude & longitude
    setTimeout(() => {
      fitAll();
    }, 500);


  } catch (error) {

    console.error(
      "Map initialization error:",
      error
    );

    showToast(
      error.message ||
      "Map could not load."
    );
  }
}


/* ============================================================
   SATELLITE BUTTON
============================================================ */

$("satelliteBtn")?.addEventListener(
  "click",
  toggleSatellite
);


/* ============================================================
   DETAILS CLOSE
============================================================ */

$("detailsClose")?.addEventListener(
  "click",
  closeDetails
);


$("detailsBackdrop")?.addEventListener(
  "click",
  closeDetails
);


/* ============================================================
   FOCUS MAP
============================================================ */

$("focusMapBtn")?.addEventListener(
  "click",
  () => {

    if (
      state.activeProject &&
      hasCoords(state.activeProject)
    ) {

      closeDetails();

      focusProject(
        state.activeProject
      );

    } else {

      showToast(
        "Exact coordinates are not available."
      );
    }
  }
);


/* ============================================================
   POPUP → VIEW DETAILS
============================================================ */

document.addEventListener(
  "click",
  (event) => {

    const button =
      event.target.closest(
        "[data-open-project]"
      );


    if (!button) {
      return;
    }


    const project =
      state.projects.find(
        (item) =>
          String(item.id) ===
          String(
            button.dataset.openProject
          )
      );


    if (project) {
      openDetails(project);
    }
  }
);


/* ============================================================
   ESCAPE KEY
============================================================ */

document.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Escape") {
      closeDetails();
    }

  }
);


/* ============================================================
   START
============================================================ */

init();