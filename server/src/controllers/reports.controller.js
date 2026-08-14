const asyncHandler = require("../utils/asyncHandler");
const reportsService = require("../services/reports.service");

const summary = asyncHandler(async (req, res) => {
  const data = await reportsService.summary();
  res.status(200).json({ success: true, data, message: "" });
});

const lowStock = asyncHandler(async (req, res) => {
  const data = await reportsService.lowStock();
  res.status(200).json({ success: true, data, message: "" });
});

const inventory = asyncHandler(async (req, res) => {
  const data = await reportsService.inventory();
  res.status(200).json({ success: true, data, message: "" });
});

module.exports = { summary, lowStock, inventory };
