const mongoose = require("mongoose");

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

TeamMemberSchema.methods.comparePassword = function (plain) {
  return Promise.resolve(plain === this.password);
};

module.exports = mongoose.model("TeamMember", TeamMemberSchema);
