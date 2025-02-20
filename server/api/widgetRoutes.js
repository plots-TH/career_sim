const express = require("express");
const router = express.Router();

const { fetchWidgets } = require("../db");

// this is localhost:3000/api/widgets
router.get("/", async (req, res, next) => {
  res.send(await fetchWidgets());
});

module.exports = router;
