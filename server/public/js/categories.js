document.addEventListener("DOMContentLoaded", () => {
  initLayout("categories");
  const user = getStoredUser();

  if (!user) {
    location.href = "/index.html";
    return;
  }

  const tbody = document.getElementById("categories-body");
  const emptyState = document.getElementById("empty-state");
  const backdrop = document.getElementById("modal-backdrop");
  const form = document.getElementById("category-form");
  const modalError = document.getElementById("modal-error");
  const modalTitle = document.getElementById("modal-title");
  const addBtn = document.getElementById("add-btn");

  if (addBtn && !canEdit(user.role)) addBtn.classList.add("hidden");

  function openModal(category) {
    modalError.classList.add("hidden");
    form.reset();
    document.getElementById("category-id").value = category?.id || "";
    document.getElementById("name").value = category?.name || "";
    document.getElementById("description").value = category?.description || "";
    modalTitle.textContent = category ? "Edit Category" : "Add Category";
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

  async function loadCategories() {
    try {
      const categories = await api.get("/categories");
      renderRows(categories);
    } catch (err) {
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
        <td class="cell-name">${escapeHtml(c.name)}</td>
        <td>${escapeHtml(c.description || "-")}</td>
        <td>${formatDate(c.created_at)}</td>
        <td class="actions-cell">
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
        if (!confirm("Delete this category?")) return;
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    modalError.classList.add("hidden");
    const id = document.getElementById("category-id").value;
    const payload = {
      name: document.getElementById("name").value.trim(),
      description: document.getElementById("description").value.trim(),
    };

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
    }
  });

  loadCategories();
});
