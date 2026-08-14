const express = require("express");
const auth = require("../middleware/auth");
const controller = require("../controllers/reports.controller");

const router = express.Router();

router.get("/summary", auth, controller.summary);
router.get("/low-stock", auth, controller.lowStock);
router.get("/inventory", auth, controller.inventory);

module.exports = router;
