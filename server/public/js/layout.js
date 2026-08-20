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

  const navHtml = NAV_ITEMS.map((item) => {
    const isActive = item.page === activePage;
    return `
      <a
        href="${item.href}"
        class="sidebar-nav-item${isActive ? " active" : ""}"
        ${isActive ? 'aria-current="page"' : ""}
      >
        ${item.label}
      </a>
    `;
  }).join("");

  mount.innerHTML = `
    <div class="brand-wrap">
      <div class="brand-mark">CI</div>
      <div class="brand-text">Cloud Inventory</div>
    </div>
    <nav aria-label="Main navigation">${navHtml}</nav>
    <div class="user-box">
      <div class="user-name">${escapeHtml(user.name)}</div>
      <div class="user-email">${escapeHtml(user.email)}</div>
      <span class="badge badge-${user.role}">${user.role}</span>
    </div>
    <div class="logout-btn">
      <button class="btn btn-secondary btn-block" id="logout-btn" type="button">Log out</button>
    </div>
  `;

  const logoutButton = document.getElementById("logout-btn");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      clearSession();
      location.href = "/index.html";
    });
  }

  const main = document.querySelector(".main-content");
  if (main) {
    const existingTopbar = main.querySelector(".topbar");
    if (!existingTopbar) {
      const topbar = document.createElement("header");
      topbar.className = "topbar";
      topbar.innerHTML = `
        <div class="topbar-left">
          <button class="sidebar-toggle" type="button" aria-label="Toggle navigation" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <div class="topbar-title">${escapeHtml(activePage.charAt(0).toUpperCase() + activePage.slice(1))}</div>
        </div>
        <div class="topbar-actions">
          <div class="avatar" aria-label="Current user">${escapeHtml(user.name).charAt(0).toUpperCase() || "U"}</div>
          <div class="user-meta">
            <span class="user-label">${escapeHtml(user.name)}</span>
            <span class="role-pill badge-${user.role}">${user.role}</span>
          </div>
        </div>
      `;

      const sidebarToggle = topbar.querySelector(".sidebar-toggle");
      const shell = document.querySelector(".app-shell");
      if (sidebarToggle && shell) {
        const updateSidebarState = (isOpen) => {
          shell.classList.toggle("sidebar-open", isOpen);
          sidebarToggle.setAttribute("aria-expanded", String(isOpen));
        };

        sidebarToggle.addEventListener("click", () => {
          updateSidebarState(!shell.classList.contains("sidebar-open"));
        });

        document.addEventListener("click", (event) => {
          if (!shell.classList.contains("sidebar-open")) return;
          const isInsideSidebar = event.target.closest(".sidebar");
          const isInsideToggle = event.target.closest(".sidebar-toggle");
          if (!isInsideSidebar && !isInsideToggle) {
            updateSidebarState(false);
          }
        });
      }

      main.prepend(topbar);
    }
  }

  document.body.classList.toggle("role-viewer", user.role === "viewer");
}
