// Handles the login and register forms. Only one of these forms exists
// per page, so both listeners are safe to attach unconditionally.

document.addEventListener("DOMContentLoaded", () => {
  if (getToken()) {
    location.href = "/dashboard.html";
    return;
  }

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorBox = document.getElementById("form-error");
      errorBox.classList.add("hidden");

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      try {
        const { token, user } = await api.post("/auth/login", { email, password });
        setSession(token, user);
        location.href = "/dashboard.html";
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.classList.remove("hidden");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorBox = document.getElementById("form-error");
      errorBox.classList.add("hidden");

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      submitBtn.disabled = true;
      try {
        const { token, user } = await api.post("/auth/register", { name, email, password });
        setSession(token, user);
        location.href = "/dashboard.html";
      } catch (err) {
        errorBox.textContent = err.message;
        errorBox.classList.remove("hidden");
      } finally {
        submitBtn.disabled = false;
      }
    });
  }
});
