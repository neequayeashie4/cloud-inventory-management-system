document.addEventListener("DOMContentLoaded", () => {
  initLayout("products");
  const user = getStoredUser();

  const tbody = document.getElementById("products-body");
  const emptyState = document.getElementById("empty-state");
  const tableError = document.getElementById("table-error");
  const tableErrorMessage = document.getElementById("table-error-message");
  const retryProductsBtn = document.getElementById("retry-products");
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
  const submitProductBtn = document.getElementById("submit-product-btn");

  if (!canEdit(user.role)) addBtn.classList.add("hidden");

  let categories = [];
  let suppliers = [];
  let currentPage = 1;
  let totalPages = 1;
  let searchDebounce;

  function setFormFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const messageNode = document.getElementById(`${fieldId}-error`);
    if (!field || !messageNode) return;

    field.classList.toggle("invalid", Boolean(message));
    messageNode.textContent = message || "";
  }

  function clearFormErrors() {
    ["sku", "name", "description", "category_id", "supplier_id", "unit_price", "quantity", "reorder_level", "image"].forEach((id) => {
      setFormFieldError(id, "");
    });
  }

  function validateForm() {
    let isValid = true;
    clearFormErrors();

    const sku = document.getElementById("sku").value.trim();
    const name = document.getElementById("name").value.trim();
    const unitPrice = Number(document.getElementById("unit_price").value);
    const quantity = Number(document.getElementById("quantity").value);
    const reorderLevel = Number(document.getElementById("reorder_level").value);
    const imageFile = document.getElementById("image").files[0];

    if (!sku) {
      setFormFieldError("sku", "SKU is required.");
      isValid = false;
    }

    if (!name) {
      setFormFieldError("name", "Product name is required.");
      isValid = false;
    }

    if (!categorySelect.value) {
      setFormFieldError("category_id", "Select a category.");
      isValid = false;
    }

    if (!supplierSelect.value) {
      setFormFieldError("supplier_id", "Select a supplier.");
      isValid = false;
    }

    if (!document.getElementById("unit_price").value || Number.isNaN(unitPrice) || unitPrice < 0) {
      setFormFieldError("unit_price", "Enter a valid unit price.");
      isValid = false;
    }

    if (!document.getElementById("quantity").value || Number.isNaN(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
      setFormFieldError("quantity", "Quantity must be a whole number of 0 or more.");
      isValid = false;
    }

    if (!document.getElementById("reorder_level").value || Number.isNaN(reorderLevel) || reorderLevel < 0 || !Number.isInteger(reorderLevel)) {
      setFormFieldError("reorder_level", "Reorder level must be a whole number of 0 or more.");
      isValid = false;
    }

    if (imageFile && imageFile.size > 5 * 1024 * 1024) {
      setFormFieldError("image", "Image must be 5MB or smaller.");
      isValid = false;
    }

    return isValid;
  }

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
    clearFormErrors();
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
    clearFormErrors();
    form.reset();
  }

  function renderLoadingState() {
    tbody.innerHTML = Array.from({ length: 5 }, () => `
      <tr class="is-loading">
        <td data-label="Image"><div class="thumb placeholder"></div></td>
        <td data-label="SKU"><div class="skeleton-row"></div></td>
        <td data-label="Name"><div class="skeleton-row"></div></td>
        <td data-label="Category"><div class="skeleton-row"></div></td>
        <td data-label="Supplier"><div class="skeleton-row"></div></td>
        <td data-label="Unit Price" class="data-numeric"><div class="skeleton-row"></div></td>
        <td data-label="Quantity" class="data-numeric"><div class="skeleton-row"></div></td>
        <td data-label="Actions"><div class="skeleton-row"></div></td>
      </tr>
    `).join("");
    emptyState.classList.add("hidden");
    tableError.classList.add("hidden");
  }

  function renderEmptyState(message) {
    tbody.innerHTML = "";
    emptyState.classList.remove("hidden");
    emptyState.innerHTML = `
      <strong>No products match that search</strong>
      <span>${escapeHtml(message || "No products match that search — clear filters.")}</span>
      <button type="button" class="btn btn-secondary btn-sm" id="clear-search-btn">Clear filters</button>
    `;
    document.getElementById("clear-search-btn").addEventListener("click", () => {
      searchInput.value = "";
      categoryFilter.value = "";
      currentPage = 1;
      loadProducts();
    });
  }

  addBtn.addEventListener("click", () => openModal(null));
  document.getElementById("modal-close").addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  ["sku", "name", "description", "category_id", "supplier_id", "unit_price", "quantity", "reorder_level"].forEach((fieldId) => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    field.addEventListener("blur", () => {
      const targetId = fieldId;
      const value = field.value.trim();
      const isNumberField = ["unit_price", "quantity", "reorder_level"].includes(targetId);
      if (!value && targetId !== "description") {
        setFormFieldError(targetId, `${field.labels?.[0]?.textContent || "This field"} is required.`);
        return;
      }
      if (isNumberField) {
        const numberValue = Number(field.value);
        if (Number.isNaN(numberValue) || numberValue < 0 || (targetId !== "unit_price" && !Number.isInteger(numberValue))) {
          setFormFieldError(targetId, `Enter a valid ${field.labels?.[0]?.textContent || "value"}.`);
        }
      }
    });
  });

  async function loadProducts() {
    const params = new URLSearchParams();
    if (searchInput.value.trim()) params.set("search", searchInput.value.trim());
    if (categoryFilter.value) params.set("category", categoryFilter.value);
    params.set("page", currentPage);
    params.set("limit", 15);

    renderLoadingState();

    try {
      const { items, pagination } = await api.get(`/products?${params.toString()}`);
      totalPages = pagination.totalPages || 1;
      paginationInfo.textContent = `Page ${pagination.page} of ${totalPages} · ${pagination.total} products`;
      prevPageBtn.disabled = pagination.page <= 1;
      nextPageBtn.disabled = pagination.page >= totalPages;
      renderRows(items);
      tableError.classList.add("hidden");
    } catch (err) {
      tbody.innerHTML = "";
      emptyState.classList.add("hidden");
      tableErrorMessage.textContent = err.message || "Unable to load products. Please retry.";
      tableError.classList.remove("hidden");
      showToast(err.message, "error");
    }
  }

  function renderRows(products) {
    if (products.length === 0) {
      renderEmptyState("No products match that search — clear filters.");
      return;
    }
    emptyState.classList.add("hidden");

    const canWrite = canEdit(user.role);
    const canRemove = canDelete(user.role);

    tbody.innerHTML = products
      .map(
        (p) => `
      <tr data-id="${p.id}">
        <td data-label="Image">${
          p.image_url
            ? `<img class="thumb" src="${p.image_url}" alt="${escapeHtml(p.name)}" />`
            : `<div class="thumb placeholder" aria-label="No product image available" role="img"></div>`
        }</td>
        <td data-label="SKU">${escapeHtml(p.sku)}</td>
        <td data-label="Name" class="cell-name">${escapeHtml(p.name)}</td>
        <td data-label="Category">${escapeHtml(p.category_name || "-")}</td>
        <td data-label="Supplier">${escapeHtml(p.supplier_name || "-")}</td>
        <td data-label="Unit Price" class="data-numeric">${formatCurrency(p.unit_price)}</td>
        <td data-label="Quantity" class="data-numeric">
          ${p.quantity}
          ${p.quantity <= p.reorder_level ? '<span class="badge badge-low">Low</span>' : ""}
        </td>
        <td data-label="Actions" class="actions-cell">
          ${canWrite ? `<button class="btn btn-secondary btn-sm edit-btn" type="button" aria-label="Edit ${escapeHtml(p.name)}">Edit</button>` : ""}
          ${canRemove ? `<button class="btn btn-danger btn-sm delete-btn" type="button" aria-label="Delete ${escapeHtml(p.name)}">Delete</button>` : ""}
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
        const row = e.target.closest("tr");
        const name = row ? row.querySelector(".cell-name")?.textContent?.trim() || "this product" : "this product";
        const confirmed = window.confirm(`Delete "${name}"? This action cannot be undone.`);
        if (!confirmed) return;
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

  retryProductsBtn.addEventListener("click", () => loadProducts());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const isValid = validateForm();
    if (!isValid) return;

    modalError.classList.add("hidden");
    const id = document.getElementById("product-id").value;
    submitProductBtn.disabled = true;
    submitProductBtn.textContent = id ? "Saving..." : "Creating...";

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
    } finally {
      submitProductBtn.disabled = false;
      submitProductBtn.textContent = "Save Product";
    }
  });

  (async () => {
    await loadLookups();
    await loadProducts();
  })();
});
