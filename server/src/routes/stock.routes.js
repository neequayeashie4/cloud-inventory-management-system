const express = require("express");
const { body, query } = require("express-validator");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const controller = require("../controllers/stock.controller");

const router = express.Router();

const movementRules = [
  body("productId").isInt({ min: 1 }).withMessage("A valid productId is required"),
  body("quantity").isInt({ min: 1 }).withMessage("Quantity must be a positive integer"),
  body("reference").optional({ checkFalsy: true }).isString(),
  body("note").optional({ checkFalsy: true }).isString(),
];

const listMovementRules = [
  query("from").optional({ checkFalsy: true }).isISO8601().withMessage("from must be a valid date"),
  query("to").optional({ checkFalsy: true }).isISO8601().withMessage("to must be a valid date"),
  query("productId").optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage("Invalid productId"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
];

router.post("/in", auth, authorize("admin", "staff"), movementRules, validate, controller.stockIn);
router.post("/out", auth, authorize("admin", "staff"), movementRules, validate, controller.stockOut);
router.get("/movements", auth, listMovementRules, validate, controller.listMovements);

module.exports = router;
