// AOS
AOS.init({
  offset: 150,
  delay: 100,
  duration: 400,
  easing: "ease",
  once: false,
  mirror: false,
  anchorPlacement: "top-bottom",
});

// Navigation
const navLinks = document.getElementById("navLinks");
const navbar = document.getElementById("navbar");
const logo = document.querySelector("nav img");
const scrollTopBtn = document.getElementById("scrollTopBtn");
const progressRing = document.getElementById("progressRing");

const circumference = 2 * Math.PI * 21;

function showMenu() {
  navLinks.style.right = "0";
}

function hideMenu() {
  navLinks.style.right = "-200px";
}

// Sticky Navbar
window.addEventListener("scroll", () => {
  if (window.scrollY > 70) {
    navbar.classList.add("scrolled");
    logo.src = "./assets/images/alhabbai-dark-logo.png";
  } else {
    navbar.classList.remove("scrolled");
    logo.src = "./assets/images/alhabbai-white-logo.png";
  }
});



function updateScrollProgress() {
  const scrollTop = window.scrollY;

  const documentHeight =
    document.documentElement.scrollHeight - window.innerHeight;

  const progress = documentHeight > 0
    ? scrollTop / documentHeight
    : 0;

  const offset = circumference - progress * circumference;

  progressRing.style.strokeDashoffset = offset;
}

window.addEventListener("scroll", updateScrollProgress);

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

updateScrollProgress();