/**
 * One-time migration: wipe bcrypt-hashed passwords so plain-text auth works.
 * Sets every member's password to their workingEmail prefix (e.g. "admin" for admin@uttirna.in)
 * as a known default, then prints the mapping.
 *
 * Run with: node scripts/resetPasswords.js
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose   = require("mongoose");
const TeamMember = require("../models/TeamMember");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("[Reset] Connected to MongoDB");

  const members = await TeamMember.find({ password: { $exists: true, $ne: null } }).select("+password");

  for (const m of members) {
    // Skip if already looks like plain text (not a bcrypt hash starting with $2)
    if (!m.password?.startsWith("$2")) {
      console.log(`[Reset] ${m.name} (${m.workingEmail}) — already plain text, skipping`);
      continue;
    }

    // Default to email prefix before @, e.g. "admin" for admin@uttirna.in
    const plain = m.workingEmail?.split("@")[0] ?? "password123";
    m.password = plain;
    await m.save();
    console.log(`[Reset] ${m.name} (${m.workingEmail}) → password reset to: "${plain}"`);
  }

  console.log("[Reset] Done.");
}

run()
  .catch((err) => { console.error("[Reset] Failed:", err.message); process.exit(1); })
  .finally(() => mongoose.disconnect());
