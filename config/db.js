const mongoose = require("mongoose");

const dotenv = require("dotenv");
dotenv.config({ path: "../../config/config.env" });

async function dbConnection() {
  const conn = await mongoose.connect(process.env.DB_URI);
  console.log("Db is connected to the host : ", conn.connection.host);
}

module.exports = dbConnection;
