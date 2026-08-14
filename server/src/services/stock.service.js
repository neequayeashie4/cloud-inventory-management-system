const pool = require("../config/db");
const AppError = require("../utils/AppError");

// SELECT ... FOR UPDATE inside a transaction is what makes two simultaneous
// "sell the last unit" requests resolve safely instead of racing.
async function recordMovement({ productId, userId, type, quantity, reference, note }) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [rows] = await conn.query("SELECT id, quantity FROM products WHERE id = ? FOR UPDATE", [
      productId,
    ]);
    const product = rows[0];
    if (!product) {
      throw new AppError("Product not found", 404, "NOT_FOUND");
    }

    if (type === "OUT" && product.quantity < quantity) {
      throw new AppError("Insufficient stock for this movement", 400, "INSUFFICIENT_STOCK");
    }

    const delta = type === "IN" ? quantity : -quantity;
    await conn.query("UPDATE products SET quantity = quantity + ? WHERE id = ?", [delta, productId]);

    const [result] = await conn.query(
      `INSERT INTO stock_movements (product_id, user_id, type, quantity, reference, note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [productId, userId, type, quantity, reference || null, note || null]
    );

    await conn.commit();

    const [[movement]] = await conn.query("SELECT * FROM stock_movements WHERE id = ?", [result.insertId]);
    return movement;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function stockIn(data) {
  return recordMovement({ ...data, type: "IN" });
}

async function stockOut(data) {
  return recordMovement({ ...data, type: "OUT" });
}

async function listMovements({ from, to, productId, page, limit }) {
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  const params = [];

  if (from) {
    conditions.push("m.created_at >= ?");
    params.push(from);
  }
  if (to) {
    conditions.push("m.created_at <= ?");
    params.push(to);
  }
  if (productId) {
    conditions.push("m.product_id = ?");
    params.push(productId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT m.*, p.name AS product_name, p.sku, u.name AS user_name
     FROM stock_movements m
     JOIN products p ON p.id = m.product_id
     JOIN users u ON u.id = m.user_id
     ${whereClause}
     ORDER BY m.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total FROM stock_movements m ${whereClause}`,
    params
  );

  return {
    items: rows,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
}

module.exports = { stockIn, stockOut, listMovements };
