const express = require("express");
const router = express.Router();

router.use("/users", require("./userRoutes.js"));
router.use("/auth", require("./authRoutes"));
router.use("/items", require("./itemRoutes.js"));
router.use("/reviews", require("./reviewRoutes.js"));
router.use("/", require("./commentRoutes.js"));

router.get("/", (req, res) => {
  res.send("Hello from the main API router!");
});

module.exports = router;
