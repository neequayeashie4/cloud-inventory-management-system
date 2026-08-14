const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const upload = require("../middleware/upload");
const controller = require("../controllers/products.controller");

const router = express.Router();

const productRules = [
  body("sku").trim().notEmpty().withMessage("SKU is required"),
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("unit_price").optional().isFloat({ min: 0 }).withMessage("Unit price must be a positive number"),
  body("quantity").optional().isInt({ min: 0 }).withMessage("Quantity must be a positive integer"),
  body("reorder_level").optional().isInt({ min: 0 }).withMessage("Reorder level must be a positive integer"),
  body("category_id").optional({ checkFalsy: true }).isInt().withMessage("Invalid category"),
  body("supplier_id").optional({ checkFalsy: true }).isInt().withMessage("Invalid supplier"),
];

router.get("/", auth, controller.list);
router.get("/:id", auth, controller.getById);
router.post(
  "/",
  auth,
  authorize("admin", "staff"),
  upload.single("image"),
  productRules,
  validate,
  controller.create
);
router.put(
  "/:id",
  auth,
  authorize("admin", "staff"),
  upload.single("image"),
  productRules,
  validate,
  controller.update
);
router.delete("/:id", auth, authorize("admin"), controller.remove);

module.exports = router;
