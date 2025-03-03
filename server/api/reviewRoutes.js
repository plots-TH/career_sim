// server/api/reviewRoutes.js
const express = require("express");
const router = express.Router();
const { client } = require("../db/db.js");
const jwt = require("jsonwebtoken");

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

// GET /api/reviews/me – Retrieve all reviews written by the logged-in user
router.get("/me", requireUser, async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM reviews WHERE user_id = $1;`;
    const { rows } = await client.query(SQL, [req.user.id]);
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

// PUT /api/reviews/:reviewId
router.put("/:reviewId", requireUser, async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, review_text } = req.body;

    // Verify the review exists and belongs to the current user
    const { rows } = await client.query(
      "SELECT * FROM reviews WHERE id = $1;",
      [reviewId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }
    const review = rows[0];
    if (review.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this review" });
    }

    // Update the review
    const updateSQL = `
      UPDATE reviews 
      SET rating = $1, review_text = $2, created_at = NOW() 
      WHERE id = $3 
      RETURNING *;
    `;
    const updateResult = await client.query(updateSQL, [
      rating,
      review_text,
      reviewId,
    ]);
    res.json(updateResult.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/reviews/:reviewId
router.delete("/:reviewId", requireUser, async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    // Verify the review exists and belongs to the current user
    const { rows } = await client.query(
      "SELECT * FROM reviews WHERE id = $1;",
      [reviewId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Review not found" });
    }
    const review = rows[0];
    if (review.user_id !== req.user.id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this review" });
    }

    // Delete the review
    await client.query("DELETE FROM reviews WHERE id = $1;", [reviewId]);
    res.json({ message: "Review deleted successfully" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
