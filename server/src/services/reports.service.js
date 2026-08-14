const pool = require("../config/db");

async function summary() {
  const [[{ totalProducts }]] = await pool.query("SELECT COUNT(*) AS totalProducts FROM products");
  const [[{ totalStockValue }]] = await pool.query(
    "SELECT COALESCE(SUM(quantity * unit_price), 0) AS totalStockValue FROM products"
  );
  const [[{ lowStockCount }]] = await pool.query(
    "SELECT COUNT(*) AS lowStockCount FROM products WHERE quantity <= reorder_level"
  );
  const [[{ movementsToday }]] = await pool.query(
    "SELECT COUNT(*) AS movementsToday FROM stock_movements WHERE DATE(created_at) = CURDATE()"
  );

  return {
    totalProducts,
    totalStockValue: Number(totalStockValue),
    lowStockCount,
    movementsToday,
  };
}

async function lowStock() {
  const [rows] = await pool.query(
    `SELECT p.id, p.sku, p.name, p.quantity, p.reorder_level, c.name AS category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.quantity <= p.reorder_level
     ORDER BY p.quantity ASC`
  );
  return rows;
}

async function inventory() {
  const [rows] = await pool.query(
    `SELECT p.id, p.sku, p.name, p.quantity, p.unit_price, p.reorder_level,
            (p.quantity * p.unit_price) AS stock_value,
            c.name AS category_name, s.name AS supplier_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     LEFT JOIN suppliers s ON s.id = p.supplier_id
     ORDER BY p.name ASC`
  );
  return rows;
}

module.exports = { summary, lowStock, inventory };
