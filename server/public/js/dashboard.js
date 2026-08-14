document.addEventListener("DOMContentLoaded", async () => {
  initLayout("dashboard");

  try {
    const [summary, lowStock] = await Promise.all([api.get("/reports/summary"), api.get("/reports/low-stock")]);

    document.getElementById("stat-total-products").textContent = summary.totalProducts;
    document.getElementById("stat-total-value").textContent = formatCurrency(summary.totalStockValue);
    document.getElementById("stat-low-stock").textContent = summary.lowStockCount;
    document.getElementById("stat-movements-today").textContent = summary.movementsToday;

    document.getElementById("stat-loading").classList.add("hidden");
    document.getElementById("stat-grid").classList.remove("hidden");

    const tbody = document.getElementById("low-stock-body");
    if (lowStock.length === 0) {
      document.getElementById("low-stock-empty").classList.remove("hidden");
    } else {
      tbody.innerHTML = lowStock
        .map(
          (p) => `
        <tr>
          <td>${escapeHtml(p.sku)}</td>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.category_name || "-")}</td>
          <td><span class="badge badge-low">${p.quantity}</span></td>
          <td>${p.reorder_level}</td>
        </tr>`
        )
        .join("");
    }
  } catch (err) {
    showToast(err.message, "error");
  }
});
