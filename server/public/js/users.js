document.addEventListener("DOMContentLoaded", () => {
  initLayout("users");
  const user = getStoredUser();

  if (!user) {
    location.href = "/index.html";
    return;
  }

  // Nothing on this page is reachable by a non-admin anyway (the server
  // rejects POST /auth/users with 403), but there's no reason to show a
  // form that can only ever fail — send them back to the dashboard.
  if (user.role !== "admin") {
    location.href = "/dashboard.html";
    return;
  }

  const form = document.getElementById("create-user-form");
  const errorBox = document.getElementById("form-error");
  const successBox = document.getElementById("form-success");
  const submitBtn = document.getElementById("submit-btn");

  function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorNode = document.getElementById(`${fieldId}-error`);
    if (!field || !errorNode) return;
    field.classList.toggle("invalid", Boolean(message));
    errorNode.textContent = message || "";
  }

  function clearFieldErrors() {
    ["name", "email", "password"].forEach((fieldId) => setFieldError(fieldId, ""));
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFieldErrors();
    errorBox.classList.add("hidden");
    successBox.classList.add("hidden");

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    let hasError = false;
    if (!name) {
      setFieldError("name", "Full name is required.");
      hasError = true;
    }
    if (!email || !validateEmail(email)) {
      setFieldError("email", "Enter a valid email address.");
      hasError = true;
    }
    if (!password || password.length < 8) {
      setFieldError("password", "Password must be at least 8 characters.");
      hasError = true;
    }
    if (hasError) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Creating...";

    try {
      const { user: created } = await api.post("/auth/users", { name, email, password, role });
      successBox.textContent = `${created.name} was created as ${created.role}.`;
      successBox.classList.remove("hidden");
      showToast("User created");
      form.reset();
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Create User";
    }
  });
});
