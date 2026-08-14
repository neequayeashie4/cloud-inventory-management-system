const asyncHandler = require("../utils/asyncHandler");
const categoriesService = require("../services/categories.service");

const list = asyncHandler(async (req, res) => {
  const data = await categoriesService.list();
  res.status(200).json({ success: true, data, message: "" });
});

const getById = asyncHandler(async (req, res) => {
  const data = await categoriesService.getById(req.params.id);
  res.status(200).json({ success: true, data, message: "" });
});

const create = asyncHandler(async (req, res) => {
  const data = await categoriesService.create(req.body);
  res.status(201).json({ success: true, data, message: "Category created" });
});

const update = asyncHandler(async (req, res) => {
  const data = await categoriesService.update(req.params.id, req.body);
  res.status(200).json({ success: true, data, message: "Category updated" });
});

const remove = asyncHandler(async (req, res) => {
  await categoriesService.remove(req.params.id);
  res.status(200).json({ success: true, data: null, message: "Category deleted" });
});

module.exports = { list, getById, create, update, remove };
