const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  // Public registration can never self-assign admin/staff — it always
  // lands as 'viewer'. Promoting/creating admin or staff accounts requires
  // an existing admin, via POST /auth/users below.
  const result = await authService.register({ name, email, password, role: "viewer" });
  res.status(201).json({ success: true, data: result, message: "Registration successful" });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  res.status(200).json({ success: true, data: result, message: "Login successful" });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getById(req.user.id);
  res.status(200).json({ success: true, data: { user }, message: "" });
});

// Admin-only account creation with an explicit role. Unlike /register, the
// new account's token is never returned here — the creating admin has no
// business holding a token for someone else's session.
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const { user } = await authService.register({ name, email, password, role });
  res.status(201).json({ success: true, data: { user }, message: "User created" });
});

module.exports = { register, login, me, createUser };
