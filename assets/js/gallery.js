/* =====================================
   IMAGE LIST
===================================== */

const images = [
  "./assets/images/img_gallery/215v1.jpg",
  "./assets/images/img_gallery/212.jpg",
  "./assets/images/img_gallery/208v1.jpg",
  "./assets/images/img_gallery/208v2.jpg",
  "./assets/images/img_gallery/211v1.jpg",
  "./assets/images/img_gallery/211v2.jpg",
  "./assets/images/img_gallery/210.jpg",
  "./assets/images/img_gallery/209v1.jpg",
  "./assets/images/img_gallery/209v2.jpg",
  "./assets/images/img_gallery/205v1.jpg",
  "./assets/images/img_gallery/204.jpg",
  "./assets/images/img_gallery/209v2.jpg",
  "./assets/images/img_gallery/198v1.jpg",
  "./assets/images/img_gallery/198v2.jpg",
  "./assets/images/img_gallery/197.jpg",
  "./assets/images/img_gallery/195.jpg",
  "./assets/images/img_gallery/195v2.jpg",
  "./assets/images/img_gallery/190.jpg",
  "./assets/images/img_gallery/189v1.jpg",
  "./assets/images/img_gallery/189v2.jpg",
  "./assets/images/img_gallery/188v1.jpg",
  "./assets/images/img_gallery/188v2.jpg",
  "./assets/images/img_gallery/177v1.webp",
  "./assets/images/img_gallery/176v1.webp",
  "./assets/images/img_gallery/176v2.webp",
  "./assets/images/img_gallery/173v1.jpg",
  "./assets/images/img_gallery/173v2.jpg",
  "./assets/images/img_gallery/172.jpg",
  "./assets/images/img_gallery/171.jpg",
  "./assets/images/img_gallery/167v1.jpg",
  "./assets/images/img_gallery/165v1.webp",
  "./assets/images/img_gallery/165v2.webp",
  "./assets/images/img_gallery/165v3.webp",
  "./assets/images/img_gallery/164.jpg",
  "./assets/images/img_gallery/163v1.webp",
  "./assets/images/img_gallery/163v2.webp",
  "./assets/images/img_gallery/162.jpg",
  "./assets/images/img_gallery/159v1.webp",
  "./assets/images/img_gallery/159v2.webp",
  "./assets/images/img_gallery/159v3.webp",
  "./assets/images/img_gallery/157v1.webp",
  "./assets/images/img_gallery/157v2.webp",
  "./assets/images/img_gallery/155v1.webp",
  "./assets/images/img_gallery/154v1.jpg",
  "./assets/images/img_gallery/154v2.jpg",
  "./assets/images/img_gallery/153v1.webp",
  "./assets/images/img_gallery/153v2.webp",
  "./assets/images/img_gallery/151v1.jpg",
  "./assets/images/img_gallery/151v2.jpg",
  "./assets/images/img_gallery/149v3.webp",
  "./assets/images/img_gallery/149v4.webp",
  "./assets/images/img_gallery/147v1.jpg",
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
