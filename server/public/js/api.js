// Single fetch wrapper: attaches the JWT, unwraps the { success, data, error }
// envelope, and redirects to the login page on a 401.
const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("token");
}

function getStoredUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

async function apiRequest(path, { method = "GET", body, isFormData = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData && body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  if (res.status === 401) {
    clearSession();
    if (!location.pathname.endsWith("index.html") && location.pathname !== "/") {
      location.href = "/index.html";
    }
    throw new Error("Session expired");
  }

  const payload = await res.json().catch(() => ({}));

  if (!res.ok || payload.success === false) {
    const message = payload?.error?.message || "Request failed";
    throw new Error(message);
  }

  return payload.data;
}

const api = {
  get: (path) => apiRequest(path),
  post: (path, body, opts = {}) => apiRequest(path, { method: "POST", body, ...opts }),
  put: (path, body, opts = {}) => apiRequest(path, { method: "PUT", body, ...opts }),
  delete: (path) => apiRequest(path, { method: "DELETE" }),
};

function requireAuth() {
  if (!getToken()) {
    location.href = "/index.html";
  }
}

function showToast(message, type = "success") {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}
