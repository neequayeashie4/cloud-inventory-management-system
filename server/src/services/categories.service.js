const pool = require("../config/db");
const AppError = require("../utils/AppError");

async function list() {
  const [rows] = await pool.query("SELECT * FROM categories ORDER BY name ASC");
  return rows;
}

async function getById(id) {
  const [rows] = await pool.query("SELECT * FROM categories WHERE id = ?", [id]);
  if (rows.length === 0) {
    throw new AppError("Category not found", 404, "NOT_FOUND");
  }
  return rows[0];
}

async function create({ name, description }) {
  const [existing] = await pool.query("SELECT id FROM categories WHERE name = ?", [name]);
  if (existing.length > 0) {
    throw new AppError("A category with this name already exists", 409, "CONFLICT");
  }
  const [result] = await pool.query("INSERT INTO categories (name, description) VALUES (?, ?)", [
    name,
    description || null,
  ]);
  return getById(result.insertId);
}

async function update(id, { name, description }) {
  await getById(id);
  await pool.query("UPDATE categories SET name = ?, description = ? WHERE id = ?", [
    name,
    description || null,
    id,
  ]);
  return getById(id);
}

async function remove(id) {
  await getById(id);
  await pool.query("DELETE FROM categories WHERE id = ?", [id]);
}

module.exports = { list, getById, create, update, remove };
