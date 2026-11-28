/**
 * One-time migration: backfill workingEmail for existing TeamMembers that don't have one.
 * Generates a placeholder from the member's name so the unique+required constraint is satisfied.
 * Run with: node scripts/migrateWorkingEmail.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const TeamMember = require("../models/TeamMember");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/uttirna";

function slugify(name) {
  return name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const members = await TeamMember.find({ workingEmail: { $in: [null, undefined, ""] } });
  console.log(`Found ${members.length} member(s) without workingEmail`);

  for (const m of members) {
    const email = `${slugify(m.name)}@uttirna.in`;
    // avoid unique collision if slug already exists
    const existing = await TeamMember.findOne({ workingEmail: email, _id: { $ne: m._id } });
    const finalEmail = existing ? `${slugify(m.name)}.${m._id.toString().slice(-4)}@uttirna.in` : email;

    await TeamMember.updateOne({ _id: m._id }, { $set: { workingEmail: finalEmail } });
    console.log(`  ${m.name} → ${finalEmail}`);
  }

  console.log("Migration complete.");
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
