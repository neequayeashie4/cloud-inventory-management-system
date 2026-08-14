const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  // Public registration can never self-assign admin/staff — that requires
  // an existing admin (see routes/auth.routes.js for the guarded variant).
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

module.exports = { register, login, me };
