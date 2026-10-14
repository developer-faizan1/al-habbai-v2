const faqItems = document.querySelectorAll(".faq__item");

faqItems.forEach((item) => {
  const question = item.querySelector(".faq__question");
  const answer = item.querySelector(".faq__answer");

  // Open first item
  if (item.classList.contains("active")) {
    answer.style.maxHeight = answer.scrollHeight + "px";
  }

  question.addEventListener("click", () => {
    faqItems.forEach((faq) => {
      if (faq !== item) {
        faq.classList.remove("active");
        faq.querySelector(".faq__answer").style.maxHeight = null;
      }
    });

    item.classList.toggle("active");

    if (item.classList.contains("active")) {
      answer.style.maxHeight = answer.scrollHeight + "px";
    } else {
      answer.style.maxHeight = null;
    }
  });
});

const cards = document.querySelectorAll(".policy__card__items");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  {
    threshold: 0.2,
  },
);

cards.forEach((card) => observer.observe(card));
