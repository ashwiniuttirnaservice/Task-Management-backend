const mongoose = require("mongoose");

/**
 * Connects to MongoDB using the URI from environment variables.
 * Exits the process if the connection fails, since the API is
 * useless without a database.
 */
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  try {
    await mongoose.connect(uri);
    console.log(
      `[MongoDB] Connected → ${mongoose.connection.host}/${mongoose.connection.name}`,
    );
  } catch (err) {
    console.error("[MongoDB] Connection failed:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
