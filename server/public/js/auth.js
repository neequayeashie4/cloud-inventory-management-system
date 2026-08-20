// Handles the login and register forms. Only one of these forms exists
// per page, so both listeners are safe to attach unconditionally.

document.addEventListener("DOMContentLoaded", () => {
  if (getToken()) {
    location.href = "/dashboard.html";
    return;
  }

  function setFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorNode = document.getElementById(`${fieldId}-error`);
    if (!field || !errorNode) return;

    const hasError = Boolean(message);
    field.classList.toggle("invalid", hasError);
    field.setAttribute("aria-invalid", hasError ? "true" : "false");
    errorNode.textContent = message || "";
  }

  function clearFieldErrors() {
    ["name", "email", "password"].forEach((fieldId) => setFieldError(fieldId, ""));
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setSubmitState(form, isLoading, label) {
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) return;

    submitBtn.disabled = isLoading;
    submitBtn.setAttribute("aria-busy", String(isLoading));
    submitBtn.classList.toggle("is-loading", isLoading);
    submitBtn.textContent = isLoading ? label : label.replace("...", "");
  }

  document.querySelectorAll(".password-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const targetId = toggle.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      toggle.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
      toggle.setAttribute("aria-pressed", String(isPassword));
      toggle.innerHTML = isPassword
        ? '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18"/><path d="M10.58 10.58A2 2 0 0 0 13.42 13.42"/><path d="M9.88 5.08A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a16.1 16.1 0 0 1-4.49 5.46"/><path d="M6.61 6.61A15.8 15.8 0 0 0 2 12s3.5 7 10 7a9.84 9.84 0 0 0 5.39-1.61"/></svg>'
        : '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>';
    });
  });

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    ["email", "password"].forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (!field) return;

      field.addEventListener("blur", () => {
        const value = field.value.trim();

        if (fieldId === "email") {
          setFieldError("email", value && validateEmail(value) ? "" : "Enter a valid email address.");
        }

        if (fieldId === "password") {
          setFieldError("password", value ? "" : "Password is required.");
        }
      });
    });

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFieldErrors();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const errorBox = document.getElementById("form-error");
      const hasEmailError = !email || !validateEmail(email);
      const hasPasswordError = !password;

      if (hasEmailError) setFieldError("email", email ? "Enter a valid email address." : "Email is required.");
      if (hasPasswordError) setFieldError("password", "Password is required.");
      if (hasEmailError || hasPasswordError) return;

      if (errorBox) errorBox.classList.add("hidden");
      setSubmitState(loginForm, true, "Signing in...");

      try {
        const { token, user } = await api.post("/auth/login", { email, password });
        setSession(token, user);
        location.href = "/dashboard.html";
      } catch (err) {
        if (errorBox) {
          errorBox.textContent = /invalid credentials|invalid email|invalid password/i.test(err.message)
            ? "Invalid email or password"
            : err.message;
          errorBox.classList.remove("hidden");
        }
      } finally {
        setSubmitState(loginForm, false, "Log in");
      }
    });
  }

  const registerForm = document.getElementById("register-form");
  if (registerForm) {
    ["name", "email", "password"].forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (!field) return;

      field.addEventListener("blur", () => {
        const value = field.value.trim();

        if (fieldId === "name") {
          setFieldError("name", value ? "" : "Full name is required.");
        }

        if (fieldId === "email") {
          setFieldError("email", value && validateEmail(value) ? "" : "Enter a valid email address.");
        }

        if (fieldId === "password") {
          setFieldError("password", value.length >= 8 ? "" : "Password must be at least 8 characters.");
        }
      });
    });

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFieldErrors();

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const errorBox = document.getElementById("form-error");
      const hasNameError = !name;
      const hasEmailError = !email || !validateEmail(email);
      const hasPasswordError = !password || password.length < 8;

      if (hasNameError) setFieldError("name", "Full name is required.");
      if (hasEmailError) setFieldError("email", email ? "Enter a valid email address." : "Email is required.");
      if (hasPasswordError) setFieldError("password", password ? "Password must be at least 8 characters." : "Password is required.");
      if (hasNameError || hasEmailError || hasPasswordError) return;

      if (errorBox) errorBox.classList.add("hidden");
      setSubmitState(registerForm, true, "Creating account...");

      try {
        const { token, user } = await api.post("/auth/register", { name, email, password });
        setSession(token, user);
        location.href = "/dashboard.html";
      } catch (err) {
        if (errorBox) {
          errorBox.textContent = err.message;
          errorBox.classList.remove("hidden");
        }
      } finally {
        setSubmitState(registerForm, false, "Register");
      }
    });
  }
});
