const express = require("express");
const { body } = require("express-validator");
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

router.post("/in", auth, authorize("admin", "staff"), movementRules, validate, controller.stockIn);
router.post("/out", auth, authorize("admin", "staff"), movementRules, validate, controller.stockOut);
router.get("/movements", auth, controller.listMovements);

module.exports = router;
