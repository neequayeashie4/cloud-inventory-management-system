document.addEventListener("DOMContentLoaded", () => {
  initLayout("suppliers");
  const user = getStoredUser();

  if (!user) {
    location.href = "/index.html";
    return;
  }

  const tbody = document.getElementById("suppliers-body");
  const emptyState = document.getElementById("empty-state");
  const backdrop = document.getElementById("modal-backdrop");
  const form = document.getElementById("supplier-form");
  const modalError = document.getElementById("modal-error");
  const modalTitle = document.getElementById("modal-title");
  const addBtn = document.getElementById("add-btn");

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
  }

  function closeModal() {
    backdrop.classList.add("hidden");
  }

  addBtn.addEventListener("click", () => openModal(null));
  document.getElementById("modal-close").addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  async function loadSuppliers() {
    try {
      const suppliers = await api.get("/suppliers");
      renderRows(suppliers);
    } catch (err) {
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
        <td class="cell-name">${escapeHtml(s.name)}</td>
        <td>${escapeHtml(s.contact_person || "-")}</td>
        <td>${escapeHtml(s.email || "-")}</td>
        <td>${escapeHtml(s.phone || "-")}</td>
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
        const supplier = suppliers.find((s) => String(s.id) === id);
        openModal(supplier);
      })
    );

    tbody.querySelectorAll(".delete-btn").forEach((btn) =>
      btn.addEventListener("click", async (e) => {
        const id = e.target.closest("tr").dataset.id;
        if (!confirm("Delete this supplier?")) return;
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
    }
  });

  loadSuppliers();
});
