const express = require("express");
const router = express.Router();
const { client } = require("../db/db.js");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// GET /api/items – Retrieve all items
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await client.query("SELECT * FROM items;");
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/items/:itemId – Retrieve a specific item by ID
router.get("/:itemId", async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { rows } = await client.query("SELECT * FROM items WHERE id = $1;", [
      itemId,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

// GET /api/items/:itemId/reviews – Retrieve all reviews for a specific item
router.get("/:itemId/reviews", async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { rows } = await client.query(
      "SELECT * FROM reviews WHERE item_id = $1;",
      [itemId]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// Middleware to verify JWT for protected routes
const requireUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Missing token" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// POST /api/items/:itemId/reviews – Create a new review for an item
router.post("/:itemId/reviews", requireUser, async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { rating, review_text } = req.body;

    // Check if a review by this user for this item already exists
    const checkSQL =
      "SELECT * FROM reviews WHERE user_id = $1 AND item_id = $2;";
    const checkResult = await client.query(checkSQL, [req.user.id, itemId]);
    if (checkResult.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Review already exists for this item" });
    }

    const reviewId = uuidv4();
    const insertSQL = `
      INSERT INTO reviews (id, user_id, item_id, rating, review_text)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const { rows } = await client.query(insertSQL, [
      reviewId,
      req.user.id,
      itemId,
      rating,
      review_text,
    ]);
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
