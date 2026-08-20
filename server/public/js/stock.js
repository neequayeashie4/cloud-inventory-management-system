document.addEventListener("DOMContentLoaded", () => {
  initLayout("stock");
  const user = getStoredUser();

  if (!user) {
    location.href = "/index.html";
    return;
  }

  const formCard = document.getElementById("movement-form-card");
  if (formCard && !canEdit(user.role)) formCard.classList.add("hidden");

  const productSelect = document.getElementById("product_id");
  const form = document.getElementById("movement-form");
  const formError = document.getElementById("form-error");
  const submitBtn = document.getElementById("submit-movement-btn");
  const tbody = document.getElementById("movements-body");
  const emptyState = document.getElementById("empty-state");
  const tableError = document.getElementById("table-error");
  const tableErrorMessage = document.getElementById("table-error-message");
  const retryBtn = document.getElementById("retry-movements");
  const fromDate = document.getElementById("from-date");
  const toDate = document.getElementById("to-date");

  async function loadProducts() {
    try {
      const { items } = await api.get("/products?limit=100");
      productSelect.innerHTML = items
        .map((p) => `<option value="${p.id}">${escapeHtml(p.sku)} — ${escapeHtml(p.name)}</option>`)
        .join("");
    } catch (err) {
      showToast(`Unable to load products for the movement form: ${err.message}`, "error");
    }
  }

  function renderLoadingState() {
    tbody.innerHTML = Array.from({ length: 5 }, () => `
      <tr class="is-loading">
        <td data-label="Date"><div class="skeleton-row"></div></td>
        <td data-label="Product"><div class="skeleton-row"></div></td>
        <td data-label="Type"><div class="skeleton-row"></div></td>
        <td data-label="Quantity" class="numeric-col"><div class="skeleton-row"></div></td>
        <td data-label="Reference"><div class="skeleton-row"></div></td>
        <td data-label="Recorded By"><div class="skeleton-row"></div></td>
      </tr>
    `).join("");
    emptyState.classList.add("hidden");
    tableError.classList.add("hidden");
  }

  async function loadMovements() {
    const params = new URLSearchParams();
    if (fromDate.value) params.set("from", fromDate.value);
    if (toDate.value) params.set("to", toDate.value);
    params.set("limit", 50);

    renderLoadingState();

    try {
      const { items } = await api.get(`/stock/movements?${params.toString()}`);
      renderRows(items);
      tableError.classList.add("hidden");
    } catch (err) {
      tbody.innerHTML = "";
      emptyState.classList.add("hidden");
      tableErrorMessage.textContent = err.message || "Unable to load stock movements. Please retry.";
      tableError.classList.remove("hidden");
      showToast(err.message, "error");
    }
  }

  function renderRows(movements) {
    if (movements.length === 0) {
      tbody.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    tbody.innerHTML = movements
      .map(
        (m) => `
      <tr>
        <td data-label="Date">${formatDate(m.created_at)}</td>
        <td data-label="Product">${escapeHtml(m.sku)} — ${escapeHtml(m.product_name)}</td>
        <td data-label="Type"><span class="badge badge-${m.type.toLowerCase()}">${m.type}</span></td>
        <td data-label="Quantity" class="numeric-col">${m.quantity}</td>
        <td data-label="Reference">${escapeHtml(m.reference || "-")}</td>
        <td data-label="Recorded By">${escapeHtml(m.user_name)}</td>
      </tr>`
      )
      .join("");
  }

  retryBtn.addEventListener("click", () => loadMovements());

  document.getElementById("filter-btn").addEventListener("click", loadMovements);
  document.getElementById("clear-filter-btn").addEventListener("click", () => {
    fromDate.value = "";
    toDate.value = "";
    loadMovements();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    formError.classList.add("hidden");

    const type = document.getElementById("type").value;
    const payload = {
      productId: productSelect.value,
      quantity: document.getElementById("quantity").value,
      reference: document.getElementById("reference").value.trim(),
      note: document.getElementById("note").value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-busy", "true");
    submitBtn.textContent = "Recording...";

    try {
      await api.post(`/stock/${type === "IN" ? "in" : "out"}`, payload);
      showToast(`Stock ${type === "IN" ? "in" : "out"} recorded`);
      form.reset();
      loadMovements();
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
      submitBtn.setAttribute("aria-busy", "false");
      submitBtn.textContent = "Record Movement";
    }
  });

  (async () => {
    if (canEdit(user.role)) await loadProducts();
    await loadMovements();
  })();
});
