const asyncHandler = require("../utils/asyncHandler");
const stockService = require("../services/stock.service");

const stockIn = asyncHandler(async (req, res) => {
  const { productId, quantity, reference, note } = req.body;
  const data = await stockService.stockIn({ productId, quantity, reference, note, userId: req.user.id });
  res.status(201).json({ success: true, data, message: "Stock in recorded" });
});

const stockOut = asyncHandler(async (req, res) => {
  const { productId, quantity, reference, note } = req.body;
  const data = await stockService.stockOut({ productId, quantity, reference, note, userId: req.user.id });
  res.status(201).json({ success: true, data, message: "Stock out recorded" });
});

const listMovements = asyncHandler(async (req, res) => {
  const { from, to, productId, page, limit } = req.query;
  const data = await stockService.listMovements({ from, to, productId, page, limit });
  res.status(200).json({ success: true, data, message: "" });
});

module.exports = { stockIn, stockOut, listMovements };
