require("express-async-errors");
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const env = require("./config/env");
const logger = require("./config/logger");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const productsRoutes = require("./routes/products.routes");
const categoriesRoutes = require("./routes/categories.routes");
const suppliersRoutes = require("./routes/suppliers.routes");
const stockRoutes = require("./routes/stock.routes");
const reportsRoutes = require("./routes/reports.routes");

const app = express();

app.set("trust proxy", 1); // behind nginx

const s3Origin = `https://${env.aws.s3Bucket}.s3.${env.aws.region}.amazonaws.com`;

const cspDirectives = {
  ...helmet.contentSecurityPolicy.getDefaultDirectives(),
  "img-src": ["'self'", "data:", s3Origin],
};

delete cspDirectives["upgrade-insecure-requests"];
delete cspDirectives.upgradeInsecureRequests;

app.use(helmet({
  contentSecurityPolicy: { directives: cspDirectives },
}));

app.use(cors()); // same-origin in production; harmless to leave enabled
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== "test") {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.originalUrl}`);
    next();
  });
}

app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, data: { status: "ok" }, message: "" });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/reports", reportsRoutes);

// Static frontend — served from the same origin as the API, so there is
// no CORS configuration and no second deployment target.
app.use(express.static(path.join(__dirname, "..", "public")));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } });
  }
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.use(errorHandler);

module.exports = app;
