document.addEventListener("DOMContentLoaded", () => {
  initLayout("products");
  const user = getStoredUser();

  const tbody = document.getElementById("products-body");
  const emptyState = document.getElementById("empty-state");
  const backdrop = document.getElementById("modal-backdrop");
  const form = document.getElementById("product-form");
  const modalError = document.getElementById("modal-error");
  const modalTitle = document.getElementById("modal-title");
  const addBtn = document.getElementById("add-btn");
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const categorySelect = document.getElementById("category_id");
  const supplierSelect = document.getElementById("supplier_id");
  const paginationInfo = document.getElementById("pagination-info");
  const prevPageBtn = document.getElementById("prev-page");
  const nextPageBtn = document.getElementById("next-page");

  if (!canEdit(user.role)) addBtn.classList.add("hidden");

  let categories = [];
  let suppliers = [];
  let currentPage = 1;
  let totalPages = 1;
  let searchDebounce;

  async function loadLookups() {
    [categories, suppliers] = await Promise.all([api.get("/categories"), api.get("/suppliers")]);

    categoryFilter.innerHTML =
      `<option value="">All categories</option>` +
      categories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");

    categorySelect.innerHTML =
      `<option value="">No category</option>` +
      categories.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");

    supplierSelect.innerHTML =
      `<option value="">No supplier</option>` +
      suppliers.map((s) => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("");
  }

  function openModal(product) {
    modalError.classList.add("hidden");
    form.reset();
    document.getElementById("product-id").value = product?.id || "";
    document.getElementById("sku").value = product?.sku || "";
    document.getElementById("name").value = product?.name || "";
    document.getElementById("description").value = product?.description || "";
    categorySelect.value = product?.category_id || "";
    supplierSelect.value = product?.supplier_id || "";
    document.getElementById("unit_price").value = product?.unit_price ?? "";
    document.getElementById("quantity").value = product?.quantity ?? 0;
    document.getElementById("reorder_level").value = product?.reorder_level ?? 10;
    modalTitle.textContent = product ? "Edit Product" : "Add Product";
    backdrop.classList.remove("hidden");
  }

  function closeModal() {
    backdrop.classList.add("hidden");
  }

  addBtn.addEventListener("click", () => openModal(null));
  document.getElementById("modal-close").addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  async function loadProducts() {
    const params = new URLSearchParams();
    if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
    if (categoryFilter.value) params.set("category", categoryFilter.value);
    params.set("page", currentPage);
    params.set("limit", 15);

    try {
      const { items, pagination } = await api.get(`/products?${params.toString()}`);
      totalPages = pagination.totalPages || 1;
      paginationInfo.textContent = `Page ${pagination.page} of ${totalPages} · ${pagination.total} products`;
      prevPageBtn.disabled = pagination.page <= 1;
      nextPageBtn.disabled = pagination.page >= totalPages;
      renderRows(items);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  function renderRows(products) {
    if (products.length === 0) {
      tbody.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    const canWrite = canEdit(user.role);
    const canRemove = canDelete(user.role);

    tbody.innerHTML = products
      .map(
        (p) => `
      <tr data-id="${p.id}">
        <td>${
          p.image_url
            ? `<img class="thumb" src="${p.image_url}" alt="${escapeHtml(p.name)}" />`
            : `<div class="thumb"></div>`
        }</td>
        <td>${escapeHtml(p.sku)}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.category_name || "-")}</td>
        <td>${escapeHtml(p.supplier_name || "-")}</td>
        <td>${formatCurrency(p.unit_price)}</td>
        <td>
          ${p.quantity}
          ${p.quantity <= p.reorder_level ? '<span class="badge badge-low">Low</span>' : ""}
        </td>
        <td class="actions-cell">
          ${canWrite ? `<button class="btn btn-secondary btn-sm edit-btn">Edit</button>` : ""}
          ${canRemove ? `<button class="btn btn-danger btn-sm delete-btn">Delete</button>` : ""}
        </td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll(".edit-btn").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.closest("tr").dataset.id;
        try {
          const product = await api.get(`/products/${id}`);
          openModal(product);
        } catch (err) {
          showToast(err.message, "error");
        }
      })
    );

    tbody.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.closest("tr").dataset.id;
        if (!confirm("Delete this product?")) return;
        try {
          await api.delete(`/products/${id}`);
          showToast("Product deleted");
          loadProducts();
        } catch (err) {
          showToast(err.message, "error");
        }
      })
    );
  }

  searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      currentPage = 1;
      loadProducts();
    }, 300);
  });

  categoryFilter.addEventListener("change", () => {
    currentPage = 1;
    loadProducts();
  });

  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage -= 1;
      loadProducts();
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage += 1;
      loadProducts();
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    modalError.classList.add("hidden");
    const id = document.getElementById("product-id").value;

    const formData = new FormData();
    formData.append("sku", document.getElementById("sku").value.trim());
    formData.append("name", document.getElementById("name").value.trim());
    formData.append("description", document.getElementById("description").value.trim());
    formData.append("category_id", categorySelect.value);
    formData.append("supplier_id", supplierSelect.value);
    formData.append("unit_price", document.getElementById("unit_price").value);
    formData.append("quantity", document.getElementById("quantity").value);
    formData.append("reorder_level", document.getElementById("reorder_level").value);

    const imageFile = document.getElementById("image").files[0];
    if (imageFile) formData.append("image", imageFile);

    try {
      if (id) {
        await api.put(`/products/${id}`, formData, { isFormData: true });
        showToast("Product updated");
      } else {
        await api.post("/products", formData, { isFormData: true });
        showToast("Product created");
      }
      closeModal();
      loadProducts();
    } catch (err) {
      modalError.textContent = err.message;
      modalError.classList.remove("hidden");
    }
  });

  (async () => {
    await loadLookups();
    await loadProducts();
  })();
});
