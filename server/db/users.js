const createUser = async () => {
  try {
    const SQL = `
      INSERT INTO users(id, username, email, password) VALUES($1, $2, $3, $4) RETURNING *;
    `;
    const { rows } = await client.query(SQL, [uuid.v4(), something]);
    return rows[0];
  } catch (err) {
    console.log(err);
  }
  console.log("created user!");
};

const fetchUsers = async () => {
  console.log("fetched users");
};

module.exports = { createUser, fetchUsers };

//CREATE TABLE users (
//  id SERIAL PRIMARY KEY,
//  username VARCHAR(50) UNIQUE NOT NULL,
//  email VARCHAR(100) UNIQUE NOT NULL,
//  password VARCHAR(100) NOT NULL,
//  created_at TIMESTAMP DEFAULT now()
//);
