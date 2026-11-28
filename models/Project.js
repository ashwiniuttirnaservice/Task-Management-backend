const mongoose = require("mongoose");

const resourceSchema = new mongoose.Schema(
  {
    title:       { type: String, trim: true, default: "" },
    type:        { type: String, enum: ["repository", "document", "deployment", "design", "reference", "other"], default: "other" },
    category:    { type: String, trim: true, default: "" },
    url:         { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    key:         { type: String, trim: true, uppercase: true, default: "" },
    description: { type: String, trim: true, default: "" },
    status:      { type: String, enum: ["planning", "active", "onHold", "completed"], default: "planning" },
    startDate:   { type: Date },
    endDate:     { type: Date },
    resources:   { type: [resourceSchema], default: [] },
    members:     { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "TeamMember" }], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
