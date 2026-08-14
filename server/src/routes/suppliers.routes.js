const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const controller = require("../controllers/suppliers.controller");

const router = express.Router();

const supplierRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").optional({ checkFalsy: true }).isEmail().withMessage("Must be a valid email"),
  body("phone").optional({ checkFalsy: true }).isString(),
  body("contact_person").optional({ checkFalsy: true }).isString(),
  body("address").optional({ checkFalsy: true }).isString(),
];

router.get("/", auth, controller.list);
router.get("/:id", auth, controller.getById);
router.post("/", auth, authorize("admin", "staff"), supplierRules, validate, controller.create);
router.put("/:id", auth, authorize("admin", "staff"), supplierRules, validate, controller.update);
router.delete("/:id", auth, authorize("admin"), controller.remove);

module.exports = router;
