const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const TeamMemberSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, "Employee name is required"],
      trim:     true,
      unique:   true,
    },
    // Primary login email — unique when set, used for future auth
    workingEmail: {
      type:     String,
      trim:     true,
      lowercase: true,
      unique:   true,
      sparse:   true,
      default:  undefined,
    },
    personalEmail: {
      type:    String,
      trim:    true,
      lowercase: true,
      default: "",
    },
    contactNumber: {
      type:    String,
      trim:    true,
      default: "",
    },
    alternateNumber: {
      type:    String,
      trim:    true,
      default: "",
    },
    role: {
      type:    String,
      enum:    ["employee", "admin"],
      default: "employee",
    },
    position: {
      type:    String,
      enum:    ["intern", "frontend", "backend", "fullStack"],
      default: "intern",
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    // Auth — only set for members who can log in
    password: {
      type:   String,
      select: false,
    },
  },
  { timestamps: true }
);

TeamMemberSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

TeamMemberSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model("TeamMember", TeamMemberSchema);
