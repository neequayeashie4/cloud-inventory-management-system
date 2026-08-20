document.addEventListener("DOMContentLoaded", () => {
  initLayout("suppliers");
  const user = getStoredUser();

  if (!user) {
    location.href = "/index.html";
    return;
  }

  const tbody = document.getElementById("suppliers-body");
  const emptyState = document.getElementById("empty-state");
  const tableError = document.getElementById("table-error");
  const tableErrorMessage = document.getElementById("table-error-message");
  const retryBtn = document.getElementById("retry-suppliers");
  const backdrop = document.getElementById("modal-backdrop");
  const form = document.getElementById("supplier-form");
  const modalError = document.getElementById("modal-error");
  const modalTitle = document.getElementById("modal-title");
  const addBtn = document.getElementById("add-btn");
  const submitBtn = document.getElementById("submit-supplier-btn");

  // Suppliers can be created/edited by admin+staff, but only admin deletes.
  if (addBtn && !canEdit(user.role)) addBtn.classList.add("hidden");

  function openModal(supplier) {
    modalError.classList.add("hidden");
    form.reset();
    document.getElementById("supplier-id").value = supplier?.id || "";
    document.getElementById("name").value = supplier?.name || "";
    document.getElementById("contact_person").value = supplier?.contact_person || "";
    document.getElementById("email").value = supplier?.email || "";
    document.getElementById("phone").value = supplier?.phone || "";
    document.getElementById("address").value = supplier?.address || "";
    modalTitle.textContent = supplier ? "Edit Supplier" : "Add Supplier";
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
        <td data-label="Contact Person"><div class="skeleton-row"></div></td>
        <td data-label="Email"><div class="skeleton-row"></div></td>
        <td data-label="Phone"><div class="skeleton-row"></div></td>
        <td data-label="Actions"><div class="skeleton-row"></div></td>
      </tr>
    `).join("");
    emptyState.classList.add("hidden");
    tableError.classList.add("hidden");
  }

  async function loadSuppliers() {
    renderLoadingState();
    try {
      const suppliers = await api.get("/suppliers");
      renderRows(suppliers);
      tableError.classList.add("hidden");
    } catch (err) {
      tbody.innerHTML = "";
      emptyState.classList.add("hidden");
      tableErrorMessage.textContent = err.message || "Unable to load suppliers. Please retry.";
      tableError.classList.remove("hidden");
      showToast(err.message, "error");
    }
  }

  function renderRows(suppliers) {
    if (suppliers.length === 0) {
      tbody.innerHTML = "";
      emptyState.classList.remove("hidden");
      return;
    }
    emptyState.classList.add("hidden");

    const canWrite = canEdit(user.role);
    const canRemove = canDelete(user.role);

    tbody.innerHTML = suppliers
      .map(
        (s) => `
      <tr data-id="${s.id}">
        <td data-label="Name" class="cell-name">${escapeHtml(s.name)}</td>
        <td data-label="Contact Person">${escapeHtml(s.contact_person || "-")}</td>
        <td data-label="Email">${escapeHtml(s.email || "-")}</td>
        <td data-label="Phone">${escapeHtml(s.phone || "-")}</td>
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
        const supplier = suppliers.find((s) => String(s.id) === id);
        openModal(supplier);
      })
    );

    tbody.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.closest("tr").dataset.id;
        const supplier = suppliers.find((s) => String(s.id) === id);
        if (!confirm(`Delete "${supplier.name}"? This action cannot be undone.`)) return;
        try {
          await api.delete(`/suppliers/${id}`);
          showToast("Supplier deleted");
          loadSuppliers();
        } catch (err) {
          showToast(err.message, "error");
        }
      })
    );
  }

  retryBtn.addEventListener("click", () => loadSuppliers());

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    modalError.classList.add("hidden");
    const id = document.getElementById("supplier-id").value;
    const payload = {
      name: document.getElementById("name").value.trim(),
      contact_person: document.getElementById("contact_person").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      address: document.getElementById("address").value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-busy", "true");
    submitBtn.textContent = id ? "Saving..." : "Creating...";

    try {
      if (id) {
        await api.put(`/suppliers/${id}`, payload);
        showToast("Supplier updated");
      } else {
        await api.post("/suppliers", payload);
        showToast("Supplier created");
      }
      closeModal();
      loadSuppliers();
    } catch (err) {
      modalError.textContent = err.message;
      modalError.classList.remove("hidden");
    } finally {
      submitBtn.disabled = false;
      submitBtn.setAttribute("aria-busy", "false");
      submitBtn.textContent = "Save Supplier";
    }
  });

  loadSuppliers();
});
