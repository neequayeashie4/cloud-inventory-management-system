const asyncHandler = require("../utils/asyncHandler");
const productsService = require("../services/products.service");

const list = asyncHandler(async (req, res) => {
  const { search, category, page, limit } = req.query;
  const data = await productsService.list({ search, category, page, limit });
  res.status(200).json({ success: true, data, message: "" });
});

const getById = asyncHandler(async (req, res) => {
  const data = await productsService.getById(req.params.id);
  res.status(200).json({ success: true, data, message: "" });
});

const create = asyncHandler(async (req, res) => {
  const data = await productsService.create(req.body, req.file);
  res.status(201).json({ success: true, data, message: "Product created" });
});

const update = asyncHandler(async (req, res) => {
  const data = await productsService.update(req.params.id, req.body, req.file);
  res.status(200).json({ success: true, data, message: "Product updated" });
});

const remove = asyncHandler(async (req, res) => {
  await productsService.remove(req.params.id);
  res.status(200).json({ success: true, data: null, message: "Product deleted" });
});

module.exports = { list, getById, create, update, remove };
