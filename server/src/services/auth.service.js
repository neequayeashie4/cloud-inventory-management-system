const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const env = require("../config/env");
const AppError = require("../utils/AppError");

const BCRYPT_COST_FACTOR = 12;

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function toPublicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

async function register({ name, email, password, role }) {
  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if (existing.length > 0) {
    throw new AppError("Email is already registered", 409, "CONFLICT");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);
  // Only admins may be created by an already-authenticated admin (see
  // controller); public registration always lands as 'viewer'.
  const safeRole = role || "viewer";

  const [result] = await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [name, email, passwordHash, safeRole]
  );

  const user = { id: result.insertId, name, email, role: safeRole };
  return { user: toPublicUser(user), token: signToken(user) };
}

async function login({ email, password }) {
  const [rows] = await pool.query(
    "SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?",
    [email]
  );
  const user = rows[0];

  // Deliberately identical error for "no such user" and "wrong password" —
  // this prevents email enumeration.
  if (!user || !user.is_active) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  const matches = await bcrypt.compare(password, user.password_hash);
  if (!matches) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  return { user: toPublicUser(user), token: signToken(user) };
}

async function getById(id) {
  const [rows] = await pool.query("SELECT id, name, email, role FROM users WHERE id = ?", [id]);
  if (rows.length === 0) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }
  return rows[0];
}

module.exports = { register, login, getById };
