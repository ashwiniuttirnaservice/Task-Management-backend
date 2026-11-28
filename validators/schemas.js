const { z } = require("zod");

/* ---- reusable primitives ---- */
const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a date in YYYY-MM-DD format");

const timeStr = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Must be a time in HH:MM format");

const objectIdStr = z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid ObjectId");

/* ---- task schemas ---- */
exports.createTaskSchema = z
  .object({
    assignedMembers: z.array(objectIdStr).min(1, "Assign at least one member"),
    title:        z.string().trim().min(1, "Task title is required"),
    description:  z.string().trim().min(1, "Description is required"),
    projectName:  z.string().trim().optional().default(""),
    priority:     z.enum(["High", "Medium", "Low"]).optional().default("Medium"),
    status:       z.enum(["Pending", "In Progress", "Completed"]).optional().default("Pending"),
    startDate:    dateStr,
    deadline:     dateStr,
    startTime:    timeStr.or(z.literal("")).optional().default(""),
    endTime:      timeStr.or(z.literal("")).optional().default(""),
  })
  .refine((v) => v.deadline >= v.startDate, {
    message: "Deadline cannot be earlier than the start date",
    path:    ["deadline"],
  })
  .refine((v) => !(v.startDate === v.deadline && v.startTime && v.endTime && v.endTime <= v.startTime), {
    message: "End time must be after start time",
    path:    ["endTime"],
  });

exports.updateTaskSchema = z
  .object({
    assignedMembers: z.array(objectIdStr).min(1).optional(),
    title:        z.string().trim().min(1).optional(),
    description:  z.string().trim().min(1).optional(),
    projectName:  z.string().trim().optional(),
    priority:     z.enum(["High", "Medium", "Low"]).optional(),
    status:       z.enum(["Pending", "In Progress", "Completed"]).optional(),
    startDate:    dateStr.optional(),
    deadline:     dateStr.optional(),
    startTime:    timeStr.optional(),
    endTime:      timeStr.optional(),
  })
  .refine(
    (v) => !v.startDate || !v.deadline || v.deadline >= v.startDate,
    { message: "Deadline cannot be earlier than the start date", path: ["deadline"] }
  )
  .refine(
    (v) => !(v.startDate && v.deadline && v.startTime && v.endTime && v.startDate === v.deadline && v.endTime <= v.startTime),
    { message: "End time must be after start time", path: ["endTime"] }
  );

exports.updateStatusSchema = z.object({
  status: z.enum(["Pending", "In Progress", "Completed"], {
    errorMap: () => ({ message: "Status must be Pending, In Progress or Completed" }),
  }),
});

/* ---- query param schemas ---- */
exports.taskQuerySchema = z.object({
  member:   objectIdStr.optional(),
  project:  z.string().trim().optional(),
  priority: z.enum(["High", "Medium", "Low"]).optional(),
  status:   z.enum(["Pending", "In Progress", "Completed"]).optional(),
  search:   z.string().trim().optional(),
});

/* ---- project schemas ---- */
const optStr = z.preprocess((v) => (v == null ? "" : v), z.string().trim());

const resourceSchema = z.object({
  title:       optStr,
  type:        z.preprocess((v) => v ?? "other", z.enum(["repository", "document", "deployment", "design", "reference", "other"])),
  category:    optStr,
  url:         z.preprocess((v) => (v == null ? "" : v), z.string().trim().url("Enter a valid URL").or(z.literal(""))),
  description: optStr,
});

exports.createProjectSchema = z.object({
  name:        z.string().trim().min(1, "Project name is required"),
  description: optStr,
  status:      z.preprocess((v) => v ?? "planning", z.enum(["planning", "active", "onHold", "completed"])),
  startDate:   z.preprocess((v) => (v == null ? "" : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal(""))),
  endDate:     z.preprocess((v) => (v == null ? "" : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal(""))),
  resources:   z.array(resourceSchema).optional().default([]),
  members:     z.array(objectIdStr).optional().default([]),
});

exports.updateProjectSchema = z.object({
  name:        z.string().trim().min(1).optional(),
  description: optStr.optional(),
  status:      z.enum(["planning", "active", "onHold", "completed"]).optional(),
  startDate:   z.preprocess((v) => (v == null ? "" : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal(""))).optional(),
  endDate:     z.preprocess((v) => (v == null ? "" : v), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).or(z.literal(""))).optional(),
  resources:   z.array(resourceSchema).optional(),
  members:     z.array(objectIdStr).optional(),
});

/* ---- team schemas ---- */
const phoneStr = z
  .string()
  .trim()
  .regex(/^\+?[\d\s\-().]{7,15}$/, "Enter a valid phone number")
  .or(z.literal(""))
  .optional()
  .default("");

exports.createMemberSchema = z.object({
  name:            z.string().trim().min(1, "Employee name is required"),
  workingEmail:    z.email({ message: "Enter a valid working email" }).optional(),
  personalEmail:   z.email({ message: "Enter a valid personal email" }).or(z.literal("")).optional().default(""),
  contactNumber:   phoneStr,
  alternateNumber: phoneStr,
  role:            z.enum(["employee", "admin"]).optional().default("employee"),
  position:        z.enum(["intern", "frontend", "backend", "fullStack"]).optional().default("intern"),
  projects:        z.array(z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid project ID")).optional().default([]),
  isActive:        z.boolean().optional().default(true),
  password:        z.string().min(6, "Password must be at least 6 characters").optional(),
});

exports.updateMemberSchema = z.object({
  name:            z.string().trim().min(1, "Employee name is required").optional(),
  workingEmail:    z.email({ message: "Enter a valid working email" }).optional(),
  personalEmail:   z.email({ message: "Enter a valid personal email" }).or(z.literal("")).optional(),
  contactNumber:   z.string().trim().optional(),
  alternateNumber: z.string().trim().optional(),
  role:            z.enum(["employee", "admin"]).optional(),
  position:        z.enum(["intern", "frontend", "backend", "fullStack"]).optional(),
  projects:        z.array(z.string().trim().regex(/^[a-f\d]{24}$/i, "Invalid project ID")).optional(),
  isActive:        z.boolean().optional(),
  password:        z.string().min(6, "Password must be at least 6 characters").optional(),
});
