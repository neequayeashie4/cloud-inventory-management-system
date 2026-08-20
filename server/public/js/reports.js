document.addEventListener("DOMContentLoaded", async () => {
  initLayout("reports");

  const user = getStoredUser();
  if (!user) {
    location.href = "/index.html";
    return;
  }

  const tbody = document.getElementById("inventory-body");
  const emptyState = document.getElementById("empty-state");
  const reportCount = document.getElementById("report-count");

  try {
    const items = await api.get("/reports/inventory");
    reportCount.textContent = `${Number(items.length).toLocaleString()} products`;

    if (items.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    tbody.innerHTML = items
      .map((p) => {
        const isLow = Number(p.quantity) <= Number(p.reorder_level);
        return `
      <tr>
        <td>${escapeHtml(p.sku)}</td>
        <td class="cell-name">${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.category_name || "-")}</td>
        <td>${escapeHtml(p.supplier_name || "-")}</td>
        <td class="data-numeric">${Number(p.quantity).toLocaleString()}</td>
        <td class="data-numeric">${formatCurrency(p.unit_price)}</td>
        <td class="data-numeric">${formatCurrency(p.stock_value)}</td>
        <td><span class="badge badge-${isLow ? "low" : "ok"}">${isLow ? "Low Stock" : "OK"}</span></td>
      </tr>`;
      })
      .join("");
  } catch (err) {
    showToast(err.message, "error");
  }
});
