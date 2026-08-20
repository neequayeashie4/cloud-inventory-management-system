document.addEventListener("DOMContentLoaded", async () => {
  initLayout("dashboard");

  try {
    const [summary, lowStock, movements] = await Promise.all([
      api.get("/reports/summary"),
      api.get("/reports/low-stock"),
      api.get("/stock/movements?limit=5"),
    ]);

    document.getElementById("stat-total-products").textContent = Number(summary.totalProducts).toLocaleString();
    document.getElementById("stat-total-value").textContent = formatCurrency(summary.totalStockValue);
    document.getElementById("stat-low-stock").textContent = Number(summary.lowStockCount).toLocaleString();
    document.getElementById("stat-movements-today").textContent = Number(summary.movementsToday).toLocaleString();

    document.getElementById("stat-loading").classList.add("hidden");
    document.getElementById("stat-grid").classList.remove("hidden");

    const tbody = document.getElementById("low-stock-body");
    const lowStockEmpty = document.getElementById("low-stock-empty");
    if (!Array.isArray(lowStock) || lowStock.length === 0) {
      lowStockEmpty.classList.remove("hidden");
    } else {
      tbody.innerHTML = lowStock
        .slice(0, 5)
        .map(
          (p) => `
        <tr>
          <td>${escapeHtml(p.sku)}</td>
          <td class="cell-name">${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.category_name || "-")}</td>
          <td><span class="badge badge-low">${Number(p.quantity).toLocaleString()}</span></td>
          <td>${Number(p.reorder_level).toLocaleString()}</td>
        </tr>`
        )
        .join("");
    }

    const movementList = document.getElementById("movement-list");
    const movementItems = Array.isArray(movements?.items) ? movements.items : [];
    if (movementItems.length === 0) {
      movementList.innerHTML = '<li class="movement-empty">No stock movements yet.</li>';
    } else {
      movementList.innerHTML = movementItems
        .slice(0, 5)
        .map((item) => {
          const typeIsIn = item.type === "IN";
          const typeLabel = typeIsIn ? "In" : "Out";
          const direction = typeIsIn ? "+" : "-";
          return `
            <li class="movement-item">
              <div class="movement-head">
                <span class="badge badge-${typeIsIn ? "in" : "out"}">${typeLabel}</span>
                <strong>${escapeHtml(item.product_name || item.sku || "Product")}</strong>
              </div>
              <div class="movement-meta">
                <span>${direction}${Number(item.quantity).toLocaleString()} units</span>
                <span>${escapeHtml(item.user_name || "System")}</span>
              </div>
              <time class="movement-time">${formatDate(item.created_at)}</time>
            </li>
          `;
        })
        .join("");
    }
  } catch (err) {
    const loading = document.getElementById("stat-loading");
    if (loading) loading.classList.add("hidden");
    showToast(err.message, "error");
  }
});
