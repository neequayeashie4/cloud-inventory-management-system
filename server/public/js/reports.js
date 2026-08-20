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
  const tableError = document.getElementById("table-error");
  const tableErrorMessage = document.getElementById("table-error-message");
  const retryBtn = document.getElementById("retry-report");

  function renderLoadingState() {
    tbody.innerHTML = Array.from({ length: 6 }, () => `
      <tr class="is-loading">
        <td data-label="SKU"><div class="skeleton-row"></div></td>
        <td data-label="Product"><div class="skeleton-row"></div></td>
        <td data-label="Category"><div class="skeleton-row"></div></td>
        <td data-label="Supplier"><div class="skeleton-row"></div></td>
        <td data-label="Quantity" class="numeric-col"><div class="skeleton-row"></div></td>
        <td data-label="Unit Price" class="numeric-col"><div class="skeleton-row"></div></td>
        <td data-label="Stock Value" class="numeric-col"><div class="skeleton-row"></div></td>
        <td data-label="Status"><div class="skeleton-row"></div></td>
      </tr>
    `).join("");
    emptyState.classList.add("hidden");
    tableError.classList.add("hidden");
  }

  async function loadReport() {
    renderLoadingState();
    try {
      const items = await api.get("/reports/inventory");
      reportCount.textContent = `${Number(items.length).toLocaleString()} products`;
      tableError.classList.add("hidden");

      if (items.length === 0) {
        tbody.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
      }
      emptyState.classList.add("hidden");

      tbody.innerHTML = items
        .map((p) => {
          const isLow = Number(p.quantity) <= Number(p.reorder_level);
          return `
        <tr>
          <td data-label="SKU">${escapeHtml(p.sku)}</td>
          <td data-label="Product" class="cell-name">${escapeHtml(p.name)}</td>
          <td data-label="Category">${escapeHtml(p.category_name || "-")}</td>
          <td data-label="Supplier">${escapeHtml(p.supplier_name || "-")}</td>
          <td data-label="Quantity" class="numeric-col">${Number(p.quantity).toLocaleString()}</td>
          <td data-label="Unit Price" class="numeric-col">${formatCurrency(p.unit_price)}</td>
          <td data-label="Stock Value" class="numeric-col">${formatCurrency(p.stock_value)}</td>
          <td data-label="Status"><span class="badge badge-${isLow ? "low" : "ok"}">${isLow ? "Low Stock" : "OK"}</span></td>
        </tr>`;
        })
        .join("");
    } catch (err) {
      tbody.innerHTML = "";
      emptyState.classList.add("hidden");
      tableErrorMessage.textContent = err.message || "Unable to load the report. Please retry.";
      tableError.classList.remove("hidden");
      showToast(err.message, "error");
    }
  }

  retryBtn.addEventListener("click", () => loadReport());
  loadReport();
});
