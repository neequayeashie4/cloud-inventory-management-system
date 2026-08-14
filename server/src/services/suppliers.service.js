const pool = require("../config/db");
const AppError = require("../utils/AppError");

async function list() {
  const [rows] = await pool.query("SELECT * FROM suppliers ORDER BY name ASC");
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query("SELECT * FROM suppliers WHERE id = ?", [id]);
  if (rows.length === 0) {
    throw new AppError("Supplier not found", 404, "NOT_FOUND");
  }
  return rows[0];
}

async function create({ name, contact_person, email, phone, address }) {
  const [result] = await pool.query(
    "INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)",
    [name, contact_person || null, email || null, phone || null, address || null]
  );
  return getById(result.insertId);
}

async function update(id, { name, contact_person, email, phone, address }) {
  await getById(id);
  await pool.query(
    "UPDATE suppliers SET name = ?, contact_person = ?, email = ?, phone = ?, address = ? WHERE id = ?",
    [name, contact_person || null, email || null, phone || null, address || null, id]
  );
  return getById(id);
}

async function remove(id) {
  await getById(id);
  await pool.query("DELETE FROM suppliers WHERE id = ?", [id]);
}

module.exports = { list, getById, create, update, remove };
