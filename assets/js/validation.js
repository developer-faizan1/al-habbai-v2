document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contactForm");
  if (!form) return;
  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const phone = document.getElementById("phone");
  const subject = document.getElementById("subject");
  const department = document.getElementById("department");
  const message = document.getElementById("message");
  const charCount = document.getElementById("charCount");
  // =========================================
  // Character Counter
  // =========================================
  message.addEventListener("input", () => {
    charCount.textContent = message.value.length;
  });
  // =========================================
  // Helper Functions
  // =========================================
  function setError(field, errorId, message) {
    const errorElement = document.getElementById(errorId);
    const wrapper = field.closest(
      ".input-wrapper, .textarea-wrapper, .select-wrapper",
    );
    field.classList.remove("success");
    field.classList.add("error");
    if (wrapper) {
      wrapper.classList.remove("success");
      wrapper.classList.add("error");
    }
    errorElement.textContent = message;
  }
  function setSuccess(field, errorId) {
    const errorElement = document.getElementById(errorId);
    const wrapper = field.closest(
      ".input-wrapper, .textarea-wrapper, .select-wrapper",
    );
    field.classList.remove("error");
    field.classList.add("success");
    if (wrapper) {
      wrapper.classList.remove("error");
      wrapper.classList.add("success");
    }
    errorElement.textContent = "";
  }
  // =========================================
  // Name Validation
  // =========================================
  function validateName() {
    const value = name.value.trim();
    if (value === "") {
      setError(name, "nameError", "Please enter your name.");
      return false;
    }
    if (value.length < 2) {
      setError(name, "nameError", "Name must contain at least 2 characters.");
      return false;
    }
    if (value.length > 80) {
      setError(name, "nameError", "Name cannot exceed 80 characters.");
      return false;
    }
    // Letters, spaces, apostrophes, dots and hyphens
    const namePattern = /^[A-Za-zÀ-ÿ.'\-\s]+$/;
    if (!namePattern.test(value)) {
      setError(name, "nameError", "Please enter a valid name.");
      return false;
    }
    setSuccess(name, "nameError");
    return true;
  }
  // =========================================
  // Email Validation
  // =========================================
  function validateEmail() {
    const value = email.value.trim();
    if (value === "") {
      setError(email, "emailError", "Please enter your email address.");
      return false;
    }
    const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailPattern.test(value)) {
      setError(email, "emailError", "Please enter a valid email address.");
      return false;
    }
    setSuccess(email, "emailError");
    return true;
  }
  // =========================================
  // Phone Validation
  // =========================================
  function validatePhone() {
    const value = phone.value.trim();
    if (value === "") {
      setError(phone, "phoneError", "Please enter your phone number.");
      return false;
    }
    // Allows +971 50 123 4567, +91 9876543210, etc.
    const phonePattern = /^\+?[0-9\s\-()]{7,20}$/;
    if (!phonePattern.test(value)) {
      setError(phone, "phoneError", "Please enter a valid phone number.");
      return false;
    }
    setSuccess(phone, "phoneError");
    return true;
  }
  // =========================================
  // Subject Validation
  // =========================================
  function validateSubject() {
    const value = subject.value.trim();
    if (value === "") {
      setError(subject, "subjectError", "Please enter a subject.");
      return false;
    }
    if (value.length < 3) {
      setError(
        subject,
        "subjectError",
        "Subject must contain at least 3 characters.",
      );
      return false;
    }
    if (value.length > 150) {
      setError(
        subject,
        "subjectError",
        "Subject cannot exceed 150 characters.",
      );
      return false;
    }
    setSuccess(subject, "subjectError");
    return true;
  }
  // =========================================
  // Department Validation
  // =========================================
  function validateDepartment() {
    if (department.value === "") {
      setError(department, "departmentError", "Please select a department.");
      return false;
    }
    setSuccess(department, "departmentError");
    return true;
  }
  // =========================================
  // Message Validation
  // =========================================
  function validateMessage() {
    const value = message.value.trim();
    if (value === "") {
      setError(message, "messageError", "Please enter your message.");
      return false;
    }
    if (value.length < 10) {
      setError(
        message,
        "messageError",
        "Message must contain at least 10 characters.",
      );
      return false;
    }
    if (value.length > 1000) {
      setError(
        message,
        "messageError",
        "Message cannot exceed 1000 characters.",
      );
      return false;
    }
    setSuccess(message, "messageError");
    return true;
  }
  // =========================================
  // Live Validation
  // =========================================
  name.addEventListener("blur", validateName);
  email.addEventListener("blur", validateEmail);
  phone.addEventListener("blur", validatePhone);
  subject.addEventListener("blur", validateSubject);
  department.addEventListener("change", validateDepartment);
  message.addEventListener("blur", validateMessage);
  // =========================================
  // Submit
  // =========================================
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const validName = validateName();
    const validEmail = validateEmail();
    const validPhone = validatePhone();
    const validSubject = validateSubject();
    const validDepartment = validateDepartment();
    const validMessage = validateMessage();
    const isValid =
      validName &&
      validEmail &&
      validPhone &&
      validSubject &&
      validDepartment &&
      validMessage;
    if (!isValid) {
      const firstError = form.querySelector(".error");
      if (firstError) {
        firstError.focus();
      }
      return;
    }
    // Submit to PHP
    form.submit();
  });
});

// Activity selection
const activityCards = document.querySelectorAll(".activity-card");

activityCards.forEach((card) => {
  card.addEventListener("click", () => {
    activityCards.forEach((item) => {
      item.classList.remove("active");
    });

    card.classList.add("active");

    const radio = card.querySelector('input[type="radio"]');

    radio.checked = true;
  });
});
