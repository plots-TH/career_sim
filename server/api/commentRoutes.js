// server/api/commentRoutes.js
const express = require("express");
const router = express.Router();
const { client } = require("../db/db.js");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

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

/**
 * POST /api/items/:itemId/reviews/:reviewId/comments
 * Create a comment on a review.
 */
router.post(
  "/items/:itemId/reviews/:reviewId/comments",
  requireUser,
  async (req, res, next) => {
    try {
      const { itemId, reviewId } = req.params;
      const { comment_text } = req.body;
      const commentId = uuidv4();

      // Check if the review exists for this item
      const reviewResult = await client.query(
        "SELECT * FROM reviews WHERE id = $1 AND item_id = $2;",
        [reviewId, itemId]
      );
      if (!reviewResult.rows.length) {
        return res
          .status(404)
          .json({ message: "Review not found for this item" });
      }

      const insertSQL = `
      INSERT INTO comments (id, user_id, review_id, comment_text)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
      const { rows } = await client.query(insertSQL, [
        commentId,
        req.user.id,
        reviewId,
        comment_text,
      ]);
      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/comments/me
 * Retrieve all comments written by the logged-in user
 */
router.get("/comments/me", requireUser, async (req, res, next) => {
  try {
    const SQL = "SELECT * FROM comments WHERE user_id = $1;";
    const { rows } = await client.query(SQL, [req.user.id]);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/users/:userId/comments/:commentId
 * Update a comment.
 */
router.put(
  "/users/:userId/comments/:commentId",
  requireUser,
  async (req, res, next) => {
    try {
      const { userId, commentId } = req.params;
      const { comment_text } = req.body;

      // Ensure the user in the token matches the userId in the URL
      if (req.user.id !== userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this comment" });
      }

      // Check if the comment exists and belongs to this user
      const checkResult = await client.query(
        "SELECT * FROM comments WHERE id = $1 AND user_id = $2;",
        [commentId, userId]
      );
      if (!checkResult.rows.length) {
        return res.status(404).json({ message: "Comment not found" });
      }

      const updateSQL = `
      UPDATE comments
      SET comment_text = $1, created_at = NOW()
      WHERE id = $2
      RETURNING *;
    `;
      const { rows } = await client.query(updateSQL, [comment_text, commentId]);
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/users/:userId/comments/:commentId
 * Delete a comment.
 */
router.delete(
  "/users/:userId/comments/:commentId",
  requireUser,
  async (req, res, next) => {
    try {
      const { userId, commentId } = req.params;

      // Ensure the user in the token matches the userId in the URL
      if (req.user.id !== userId) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this comment" });
      }

      // Check if the comment exists and belongs to this user
      const checkResult = await client.query(
        "SELECT * FROM comments WHERE id = $1 AND user_id = $2;",
        [commentId, userId]
      );
      if (!checkResult.rows.length) {
        return res.status(404).json({ message: "Comment not found" });
      }

      await client.query("DELETE FROM comments WHERE id = $1;", [commentId]);
      res.json({ message: "Comment deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
