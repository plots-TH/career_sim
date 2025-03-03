const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(express.json());
app.use(cors());
app.use("/api", require("./server/api"));

const { client, createTables } = require("./server/db/db.js");
const PORT = process.env.PORT || 3000;

const init = async () => {
  try {
    await client.connect();
    await createTables();
    console.log("Database tables are set up!");
    app.listen(PORT, () => {
      console.log(`Server alive on PORT ${PORT}`);
    });
  } catch (err) {
    console.error(err);
  }
};

init();
