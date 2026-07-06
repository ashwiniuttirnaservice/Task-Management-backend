const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    employeeName: {
      type: String,
      required: [true, "Employee name is required"],
      trim: true
    },
    projectName: {
      type: String,
      trim: true,
      default: ""
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true
    },
    description: {
      type: String,
      required: [true, "Task description is required"],
      trim: true
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium"
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending"
    },
    // Stored as YYYY-MM-DD strings to match the <input type="date"> values
    // coming straight from the frontend — this keeps lexical sorting valid
    // and avoids timezone drift that a Date type would introduce.
    startDate: {
      type: String,
      required: [true, "Start date is required"]
    },
    deadline: {
      type: String,
      required: [true, "Deadline is required"]
    },
    // Stored as HH:mm strings to match <input type="time"> values, same
    // reasoning as startDate/deadline above
    startTime: {
      type: String,
      required: [true, "Start time is required"]
    },
    endTime: {
      type: String,
      required: [true, "End time is required"]
    }
  },
  { timestamps: true }
);

// Helpful indexes for the filters/sorts the dashboard performs most often
TaskSchema.index({ employeeName: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ deadline: 1 });

module.exports = mongoose.model("Task", TaskSchema);
