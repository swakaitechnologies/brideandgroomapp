const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

async function ensureDatabaseExists() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    console.log(`Checking if database "${process.env.DB_NAME}" exists...`);
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`,
    );
    console.log(`✅ Database "${process.env.DB_NAME}" is ready.`);
  } catch (error) {
    console.error("❌ Error creating/checking database:", error.message);
  } finally {
    await connection.end();
  }
}

ensureDatabaseExists();
