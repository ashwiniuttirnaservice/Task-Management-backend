/**
 * Seeds the admin TeamMember (the login account).
 * Safe to re-run — skips if admin@uttirna.in already exists.
 * Run with: node scripts/seedAdmin.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose   = require("mongoose");
const TeamMember = require("../models/TeamMember");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("[Seed] Connected to MongoDB");

  const existing = await TeamMember.findOne({ workingEmail: "admin@uttirna.in" });
  if (existing) {
    console.log("[Seed] Admin already exists — skipping.");
    return;
  }

  await TeamMember.create({
    name:         "Admin",
    workingEmail: "admin@uttirna.in",
    password:     "admin123",        // hashed by pre-save hook
    role:         "admin",
    position:     "fullStack",
    projects:     [],
    isActive:     true,
  });

  console.log("[Seed] Admin created → admin@uttirna.in / admin123");
}

run()
  .catch((err) => { console.error("[Seed] Failed:", err.message); process.exit(1); })
  .finally(() => mongoose.disconnect());
