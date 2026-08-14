document.addEventListener("DOMContentLoaded", () => {
  initLayout("stock");
  const user = getStoredUser();

  const formCard = document.getElementById("movement-form-card");
  if (!canEdit(user.role)) formCard.classList.add("hidden");

  const productSelect = document.getElementById("product_id");
  const form = document.getElementById("movement-form");
  const formError = document.getElementById("form-error");
  const tbody = document.getElementById("movements-body");
  const emptyState = document.getElementById("empty-state");
  const fromDate = document.getElementById("from-date");
  const toDate = document.getElementById("to-date");

  async function loadProducts() {
    const { items } = await api.get("/products?limit=100");
    productSelect.innerHTML = items
      .map((p) => `<option value="${p.id}">${escapeHtml(p.sku)} — ${escapeHtml(p.name)}</option>`)
      .join("");
  }

  async function loadMovements() {
    const params = new URLSearchParams();
    if (fromDate.value) params.set("from", fromDate.value);
    if (toDate.value) params.set("to", toDate.value);
    params.set("limit", 50);

    try {
      const { items } = await api.get(`/stock/movements?${params.toString()}`);
      renderRows(items);
    } catch (err) {
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
        <td>${formatDate(m.created_at)}</td>
        <td>${escapeHtml(m.sku)} — ${escapeHtml(m.product_name)}</td>
        <td><span class="badge badge-${m.type.toLowerCase()}">${m.type}</span></td>
        <td>${m.quantity}</td>
        <td>${escapeHtml(m.reference || "-")}</td>
        <td>${escapeHtml(m.user_name)}</td>
      </tr>`
      )
      .join("");
  }

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

    try {
      await api.post(`/stock/${type === "IN" ? "in" : "out"}`, payload);
      showToast(`Stock ${type === "IN" ? "in" : "out"} recorded`);
      form.reset();
      loadMovements();
    } catch (err) {
      formError.textContent = err.message;
      formError.classList.remove("hidden");
    }
  });

  (async () => {
    if (canEdit(user.role)) await loadProducts();
    await loadMovements();
  })();
});
