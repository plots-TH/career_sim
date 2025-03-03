const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.send(["user1", "user2", "user3"]);
});

module.exports = router;
