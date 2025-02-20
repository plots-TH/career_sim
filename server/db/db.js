const pg = require("pg");
require("dotenv").config();

const client = new pg.Client();

// create tables
const createTables = async () => {
  try {
    const SQL = `
    DROP TABLE IF EXISTS comments;
    DROP TABLE IF EXISTS reviews;
    DROP TABLE IF EXISTS items;
    DROP TABLE IF EXISTS users;

    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE items (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      avg_rating FLOAT DEFAULT 0,
      created_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
      rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
      review_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT now()
    );

    CREATE TABLE comments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
        comment_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT now()
      );
    `;
    console.log("Creating tables...");
    await client.query(SQL);
    console.log("Tables created!");
  } catch (err) {
    console.error(err);
  }
};

//const createWidget = async (widgetName) => {
//  try {
//    // beware of RETURN * if a user password is involved for example in a "createUser" function
//    const SQL = `INSERT INTO widgets(name) VALUES($1) RETURNING *;`;
//    const { rows } = await client.query(SQL, [widgetName]);
//    return rows[0];
//  } catch (err) {
//    console.error(err);
//  }
//};
//
//const fetchWidgets = async () => {
//  try {
//    const SQL = `SELECT * FROM widgets;`;
//    const { rows } = await client.query(SQL);
//    return rows;
//  } catch (err) {
//    console.error(err);
//  }
//};

module.exports = { client, createTables };
