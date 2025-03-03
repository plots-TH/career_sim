// server/seed.js
require("dotenv").config();
const { client, createTables } = require("./db/db.js");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");

const seedDb = async () => {
  try {
    await client.connect();
    await createTables();
    console.log("Tables created successfully!");

    // Seed a Dummy User
    const dummyUserId = uuidv4();
    const hashedPassword = await bcrypt.hash("dummy_password", 10);
    const dummyUserSQL = `
      INSERT INTO users (id, username, email, password)
      VALUES ($1, 'dummy_user', 'dummy@example.com', $2)
      RETURNING *;
    `;
    const { rows: dummyUserRows } = await client.query(dummyUserSQL, [
      dummyUserId,
      hashedPassword,
    ]);
    console.log("Dummy user inserted:", dummyUserRows[0]);

    // Seed Dummy Items
    const insertItemsSQL = `
      INSERT INTO items (id, name, description)
      VALUES 
        ($1, $2, $3),
        ($4, $5, $6),
        ($7, $8, $9)
      RETURNING *;
    `;
    const itemsValues = [
      uuidv4(),
      "Book One",
      "A great book about adventures",
      uuidv4(),
      "Restaurant One",
      "A nice restaurant with excellent reviews",
      uuidv4(),
      "Gadget One",
      "A cool gadget with modern features",
    ];
    const { rows: itemsRows } = await client.query(insertItemsSQL, itemsValues);
    console.log("Items seeded:", itemsRows);

    // Seed dummy reviews for each item
    for (const item of itemsRows) {
      const reviewId = uuidv4();
      const reviewSQL = `
        INSERT INTO reviews (id, user_id, item_id, rating, review_text)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      // randomly generate a number between 1 and 5 to seed a rating for the reviews
      const rating = Math.floor(Math.random() * 5) + 1;
      const reviewText = `Review for ${item.name}`;
      const { rows: reviewRows } = await client.query(reviewSQL, [
        reviewId,
        dummyUserId,
        item.id,
        rating,
        reviewText,
      ]);
      console.log("Review seeded:", reviewRows[0]);
    }
  } catch (err) {
    console.error("Error seeding data:", err);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
};

seedDb();
