const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { client } = require("../db/db.js");
const { v4: uuidv4 } = require("uuid");

// Middleware to protect routes
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

// POST /api/auth/register
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const SQL = `
      INSERT INTO users(id, username, email, password)
      VALUES($1, $2, $3, $4)
      RETURNING id, username, email, created_at;
    `;
    const { rows } = await client.query(SQL, [
      id,
      username,
      email,
      hashedPassword,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const SQL = `SELECT * FROM users WHERE email = $1;`;
    const { rows } = await client.query(SQL, [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({ token });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get("/me", requireUser, async (req, res, next) => {
  try {
    const SQL = `
      SELECT id, username, email, created_at
      FROM users
      WHERE id = $1;
    `;
    const { rows } = await client.query(SQL, [req.user.id]);
    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
