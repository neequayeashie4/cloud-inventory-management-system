// Renders the shared sidebar/nav shell and exposes RBAC helpers used by
// every authenticated page (dashboard, products, categories, suppliers,
// stock, reports).

const NAV_ITEMS = [
  { href: "/dashboard.html", label: "Dashboard", page: "dashboard" },
  { href: "/products.html", label: "Products", page: "products" },
  { href: "/categories.html", label: "Categories", page: "categories" },
  { href: "/suppliers.html", label: "Suppliers", page: "suppliers" },
  { href: "/stock.html", label: "Stock", page: "stock" },
  { href: "/reports.html", label: "Reports", page: "reports" },
];

function canEdit(role) {
  return role === "admin" || role === "staff";
}

function canDelete(role) {
  return role === "admin";
}

function initLayout(activePage) {
  requireAuth();
  const user = getStoredUser();
  const mount = document.getElementById("sidebar-mount");
  if (!mount || !user) return;

  const navHtml = NAV_ITEMS.map(
    (item) =>
      `<a href="${item.href}" class="${item.page === activePage ? "active" : ""}">${item.label}</a>`
  ).join("");

  mount.innerHTML = `
    <div class="brand">Cloud Inventory</div>
    <nav>${navHtml}</nav>
    <div class="user-box">
      <div>${escapeHtml(user.name)}</div>
      <div class="text-muted">${escapeHtml(user.email)}</div>
      <span class="badge badge-${user.role}">${user.role}</span>
    </div>
    <div class="logout-btn">
      <button class="btn btn-secondary btn-block" id="logout-btn">Log out</button>
    </div>
  `;

  document.getElementById("logout-btn").addEventListener("click", () => {
    clearSession();
    location.href = "/index.html";
  });

  document.body.classList.toggle("role-viewer", user.role === "viewer");
}
