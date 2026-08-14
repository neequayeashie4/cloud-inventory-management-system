const express = require("express");
const { body } = require("express-validator");
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const validate = require("../middleware/validate");
const controller = require("../controllers/categories.controller");

const router = express.Router();

const categoryRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("description").optional({ checkFalsy: true }).isString(),
];

router.get("/", auth, controller.list);
router.get("/:id", auth, controller.getById);
router.post("/", auth, authorize("admin"), categoryRules, validate, controller.create);
router.put("/:id", auth, authorize("admin"), categoryRules, validate, controller.update);
router.delete("/:id", auth, authorize("admin"), controller.remove);

module.exports = router;
