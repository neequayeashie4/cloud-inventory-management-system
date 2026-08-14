const pool = require("../config/db");
const AppError = require("../utils/AppError");
const { uploadObject, deleteObject, getObjectSignedUrl } = require("../config/s3");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const BASE_SELECT = `
  SELECT p.*, c.name AS category_name, s.name AS supplier_name
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
  LEFT JOIN suppliers s ON s.id = p.supplier_id
`;

async function withSignedImageUrl(product) {
  if (!product) return product;
  const imageUrl = await getObjectSignedUrl(product.image_key);
  return { ...product, image_url: imageUrl };
}

async function list({ search, category, page, limit }) {
  const pageNum = Math.max(parseInt(page, 10) || DEFAULT_PAGE, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];

  if (search) {
    conditions.push("(p.name LIKE ? OR p.sku LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    conditions.push("p.category_id = ?");
    params.push(category);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `${BASE_SELECT} ${whereClause} ORDER BY p.name ASC LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM products p ${whereClause}`,
    params
  );

  const items = await Promise.all(rows.map(withSignedImageUrl));

  return {
    items,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
}

async function getById(id) {
  const [rows] = await pool.query(`${BASE_SELECT} WHERE p.id = ?`, [id]);
  if (rows.length === 0) {
    throw new AppError("Product not found", 404, "NOT_FOUND");
  }
  return withSignedImageUrl(rows[0]);
}

async function create(data, file) {
  const { sku, name, description, category_id, supplier_id, unit_price, quantity, reorder_level } = data;

  const [existing] = await pool.query("SELECT id FROM products WHERE sku = ?", [sku]);
  if (existing.length > 0) {
    throw new AppError("A product with this SKU already exists", 409, "CONFLICT");
  }

  let imageKey = null;
  if (file) {
    imageKey = await uploadObject(file);
  }

  const [result] = await pool.query(
    `INSERT INTO products
      (sku, name, description, category_id, supplier_id, unit_price, quantity, reorder_level, image_key)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sku,
      name,
      description || null,
      category_id || null,
      supplier_id || null,
      unit_price || 0,
      quantity || 0,
      reorder_level || 10,
      imageKey,
    ]
  );

  return getById(result.insertId);
}

async function update(id, data, file) {
  const existing = await pool.query("SELECT image_key FROM products WHERE id = ?", [id]);
  const current = existing[0][0];
  if (!current) {
    throw new AppError("Product not found", 404, "NOT_FOUND");
  }

  const { sku, name, description, category_id, supplier_id, unit_price, quantity, reorder_level } = data;

  let imageKey = current.image_key;
  if (file) {
    imageKey = await uploadObject(file);
    // Best-effort cleanup of the replaced image; a failure here shouldn't
    // block the product update.
    if (current.image_key) {
      deleteObject(current.image_key).catch(() => {});
    }
  }

  await pool.query(
    `UPDATE products SET
      sku = ?, name = ?, description = ?, category_id = ?, supplier_id = ?,
      unit_price = ?, quantity = ?, reorder_level = ?, image_key = ?
     WHERE id = ?`,
    [
      sku,
      name,
      description || null,
      category_id || null,
      supplier_id || null,
      unit_price || 0,
      quantity || 0,
      reorder_level || 10,
      imageKey,
      id,
    ]
  );

  return getById(id);
}

async function remove(id) {
  const [rows] = await pool.query("SELECT image_key FROM products WHERE id = ?", [id]);
  if (rows.length === 0) {
    throw new AppError("Product not found", 404, "NOT_FOUND");
  }
  await pool.query("DELETE FROM products WHERE id = ?", [id]);
  if (rows[0].image_key) {
    deleteObject(rows[0].image_key).catch(() => {});
  }
}

module.exports = { list, getById, create, update, remove };
