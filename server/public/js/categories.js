document.addEventListener("DOMContentLoaded", () => {
  initLayout("categories");
  const user = getStoredUser();

  if (!user) {
    location.href = "/index.html";
    return;
  }

  const tbody = document.getElementById("categories-body");
  const emptyState = document.getElementById("empty-state");
  const tableError = document.getElementById("table-error");
  const tableErrorMessage = document.getElementById("table-error-message");
  const retryBtn = document.getElementById("retry-categories");
  const backdrop = document.getElementById("modal-backdrop");
  const form = document.getElementById("category-form");
  const modalError = document.getElementById("modal-error");
  const modalTitle = document.getElementById("modal-title");
  const addBtn = document.getElementById("add-btn");
  const submitBtn = document.getElementById("submit-category-btn");

  if (addBtn && !canEdit(user.role)) addBtn.classList.add("hidden");

  function openModal(category) {
    modalError.classList.add("hidden");
    form.reset();
    document.getElementById("category-id").value = category?.id || "";
    document.getElementById("name").value = category?.name || "";
    document.getElementById("description").value = category?.description || "";
    modalTitle.textContent = category ? "Edit Category" : "Add Category";
    backdrop.classList.remove("hidden");
    activateModal(backdrop);
  }

  function closeModal() {
    deactivateModal(backdrop);
    backdrop.classList.add("hidden");
  }

  addBtn.addEventListener("click", () => openModal(null));
  document.getElementById("modal-close").addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  function renderLoadingState() {
    tbody.innerHTML = Array.from({ length: 4 }, () => `
      <tr class="is-loading">
        <td data-label="Name"><div class="skeleton-row"></div></td>
        <td data-label="Description"><div class="skeleton-row"></div></td>
        <td data-label="Created"><div class="skeleton-row"></div></td>
        <td data-label="Actions"><div class="skeleton-row"></div></td>
      </tr>
    `).join("");
    emptyState.classList.add("hidden");
    tableError.classList.add("hidden");
  }

  async function loadCategories() {
    renderLoadingState();
    try {
      const categories = await api.get("/categories");
      renderRows(categories);
      tableError.classList.add("hidden");
    } catch (err) {
      tbody.innerHTML = "";
      emptyState.classList.add("hidden");
      tableErrorMessage.textContent = err.message || "Unable to load categories. Please retry.";
      tableError.classList.remove("hidden");
      showToast(err.message, "error");
    }
  }

  function renderRows(categories) {
    if (categories.length === 0) {
      tbody.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    const canWrite = canEdit(user.role);
    const canRemove = canDelete(user.role);

    tbody.innerHTML = categories
      .map(
        (c) => `
      <tr data-id="${c.id}">
        <td data-label="Name" class="cell-name">${escapeHtml(c.name)}</td>
        <td data-label="Description">${escapeHtml(c.description || "-")}</td>
        <td data-label="Created">${formatDate(c.created_at)}</td>
        <td data-label="Actions" class="actions-cell">
          ${canWrite ? `<button class="btn btn-secondary btn-sm edit-btn" type="button">Edit</button>` : ""}
          ${canRemove ? `<button class="btn btn-danger btn-sm delete-btn" type="button">Delete</button>` : ""}
        </td>
      </tr>`
      )
      .join("");

    tbody.querySelectorAll(".edit-btn").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const id = e.target.closest("tr").dataset.id;
        const category = categories.find((c) => String(c.id) === id);
        openModal(category);
      })
    );

    tbody.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.closest("tr").dataset.id;
        const category = categories.find((c) => String(c.id) === id);
        if (!confirm(`Delete "${category.name}"? This action cannot be undone.`)) return;
        try {
          await api.delete(`/categories/${id}`);
          showToast("Category deleted");
          loadCategories();
        } catch (err) {
          showToast(err.message, "error");
        }
      })
    );
  }

  retryBtn.addEventListener("click", () => loadCategories());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    modalError.classList.add("hidden");
    const id = document.getElementById("category-id").value;
    const payload = {
      name: document.getElementById("name").value.trim(),
      description: document.getElementById("description").value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-busy", "true");
    submitBtn.textContent = id ? "Saving..." : "Creating...";

    try {
      if (id) {
        await api.put(`/categories/${id}`, payload);
        showToast("Category updated");
      } else {
        await api.post("/categories", payload);
        showToast("Category created");
      }
      closeModal();
      loadCategories();
    } catch (err) {
      modalError.textContent = err.message;
      modalError.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
      submitBtn.setAttribute("aria-busy", "false");
      submitBtn.textContent = "Save Category";
    }
  });

  loadCategories();
});
