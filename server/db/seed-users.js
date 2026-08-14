// Creates the three demo accounts referenced in the README (admin/staff/viewer).
// Run this before seed.sql, since stock_movements.user_id has a foreign key
// to users and needs a real row to point at.
//
// Usage: node db/seed-users.js
require("dotenv").config();
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");

const DEMO_PASSWORD = "Demo@12345";
const BCRYPT_COST_FACTOR = 12;

const DEMO_USERS = [
  { name: "Demo Admin", email: "admin@demo.com", role: "admin" },
  { name: "Demo Staff", email: "staff@demo.com", role: "staff" },
  { name: "Demo Viewer", email: "viewer@demo.com", role: "viewer" },
];

async function main() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_COST_FACTOR);

  for (const user of DEMO_USERS) {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = VALUES(role)`,
      [user.name, user.email, passwordHash, user.role]
    );
    console.log(`Seeded ${user.role}: ${user.email} / ${DEMO_PASSWORD}`);
  }

  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
