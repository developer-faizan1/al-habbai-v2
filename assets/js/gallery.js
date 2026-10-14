/* =====================================
   IMAGE LIST
===================================== */

const images = [
  "./assets/images/img_gallery/p215v1.webp",
  "./assets/images/img_gallery/p212v1.webp",
  "./assets/images/img_gallery/p208v1.webp",
  "./assets/images/img_gallery/p211v1.webp",
  "./assets/images/img_gallery/p210v1.webp",
  "./assets/images/img_gallery/p209v1.webp",
  "./assets/images/img_gallery/198v2.webp",
  "./assets/images/img_gallery/197v2.webp",
  "./assets/images/img_gallery/195v1.webp",
  "./assets/images/img_gallery/195v2.webp",
  "./assets/images/img_gallery/190v3.webp",
  "./assets/images/img_gallery/165v1.webp",
  "./assets/images/img_gallery/165v2.webp",
  "./assets/images/img_gallery/189v1.webp",
  "./assets/images/img_gallery/188v2.webp",
  "./assets/images/img_gallery/177v1.webp",
  "./assets/images/img_gallery/176v1.webp",
  "./assets/images/img_gallery/173v2.webp",
  "./assets/images/img_gallery/172v1.webp",
  "./assets/images/img_gallery/171v1.webp",
  "./assets/images/img_gallery/167v1.webp",
  "./assets/images/img_gallery/167v2.webp",
  "./assets/images/img_gallery/164v3.webp",
  "./assets/images/img_gallery/137v1.webp",
  "./assets/images/img_gallery/137v3.webp",
  "./assets/images/img_gallery/163v2.webp",
  "./assets/images/img_gallery/159v1.webp",
  "./assets/images/img_gallery/159v2.webp",
  "./assets/images/img_gallery/159v3.webp",
  "./assets/images/img_gallery/162v1.webp",
  "./assets/images/img_gallery/151v1.webp",
  "./assets/images/img_gallery/151v2.webp",
  "./assets/images/img_gallery/149v4.webp",
  "./assets/images/img_gallery/147v1.webp",
  "./assets/images/img_gallery/146v1.webp",
  "./assets/images/img_gallery/146v2.webp",
  "./assets/images/img_gallery/146v3.webp",
  "./assets/images/img_gallery/142v1.webp",
  "./assets/images/img_gallery/140v1.webp",
  "./assets/images/img_gallery/136v1.webp",
  "./assets/images/img_gallery/132v1.webp",
  "./assets/images/img_gallery/129v1.webp",
];

/* =====================================
   ELEMENTS
===================================== */

const galleryGrid = document.getElementById("galleryGrid");

const lightbox = document.getElementById("lightbox");

const lightboxImage = document.getElementById("lightboxImage");

const closeBtn = document.getElementById("closeBtn");

const prevBtn = document.getElementById("prevBtn");

const nextBtn = document.getElementById("nextBtn");

const imageCounter = document.getElementById("imageCounter");

let currentIndex = 0;

/* =====================================
   CREATE GALLERY
===================================== */

images.forEach((image, index) => {
  const card = document.createElement("div");

  card.className = "gallery-card";
  card.setAttribute("data-aos", "fade-up");

  card.innerHTML = `
        <img
            src="${image}"
            alt="Gallery Image ${index + 1}"
            loading="lazy"
        >

        <div class="gallery-overlay">
            <div class="zoom-icon">
                ⤢
            </div>
        </div>
    `;

  card.addEventListener("click", () => {
    openLightbox(index);
  });

  galleryGrid.appendChild(card);
});

/* =====================================
   OPEN LIGHTBOX
===================================== */

function openLightbox(index) {
  currentIndex = index;

  updateLightbox();

  lightbox.classList.add("active");

  document.body.style.overflow = "hidden";
}

/* =====================================
   UPDATE IMAGE
===================================== */

function updateLightbox() {
  lightboxImage.src = images[currentIndex];

  lightboxImage.alt = `Gallery Image ${currentIndex + 1}`;

  imageCounter.textContent = `${currentIndex + 1} / ${images.length}`;
}

/* =====================================
   CLOSE LIGHTBOX
===================================== */

function closeLightbox() {
  lightbox.classList.remove("active");

  document.body.style.overflow = "";
}

closeBtn.addEventListener("click", closeLightbox);

/* =====================================
   NEXT IMAGE
===================================== */

function nextImage() {
  currentIndex++;

  if (currentIndex >= images.length) {
    currentIndex = 0;
  }

  updateLightbox();
}

nextBtn.addEventListener("click", nextImage);

/* =====================================
   PREVIOUS IMAGE
===================================== */

function previousImage() {
  currentIndex--;

  if (currentIndex < 0) {
    currentIndex = images.length - 1;
  }

  updateLightbox();
}

prevBtn.addEventListener("click", previousImage);

/* =====================================
   CLICK OUTSIDE IMAGE
===================================== */

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) {
    closeLightbox();
  }
});

/* =====================================
   KEYBOARD CONTROLS
===================================== */

document.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("active")) {
    return;
  }

  if (e.key === "Escape") {
    closeLightbox();
  }

  if (e.key === "ArrowRight") {
    nextImage();
  }

  if (e.key === "ArrowLeft") {
    previousImage();
  }
});
