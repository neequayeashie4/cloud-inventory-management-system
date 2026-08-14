const asyncHandler = require("../utils/asyncHandler");
const suppliersService = require("../services/suppliers.service");

const list = asyncHandler(async (req, res) => {
  const data = await suppliersService.list();
  res.status(200).json({ success: true, data, message: "" });
});

const getById = asyncHandler(async (req, res) => {
  const data = await suppliersService.getById(req.params.id);
  res.status(200).json({ success: true, data, message: "" });
});

const create = asyncHandler(async (req, res) => {
  const data = await suppliersService.create(req.body);
  res.status(201).json({ success: true, data, message: "Supplier created" });
});

const update = asyncHandler(async (req, res) => {
  const data = await suppliersService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data, message: "Supplier updated" });
});

const remove = asyncHandler(async (req, res) => {
  await suppliersService.remove(req.params.id);
  res.status(200).json({ success: true, data: null, message: "Supplier deleted" });
});

module.exports = { list, getById, create, update, remove };
