require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const connectDB  = require("./config/db");
const taskRoutes = require("./routes/taskRoutes");
const teamRoutes = require("./routes/teamRoutes");
const TeamMember = require("./models/TeamMember");
const { TEAM_DATA } = require("./utils/teamData");
const AppError     = require("./utils/AppError");
const sendResponse = require("./utils/response");
const STATUS       = require("./utils/statusCodes");

const app = express();

// ---- Middleware ----
// ---- Middleware ----
const allowedOrigins = (process.env.CLIENT_ORIGIN || "https://task.uttirna.in")
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

app.use(express.json());

// ---- Routes ----
app.get("/", (req, res) => {
  res.json({ success: true, message: "TaskPilot API is running" });
});
app.use("/api/tasks", taskRoutes);
app.use("/api/team", teamRoutes);

// ---- 404 handler ----
app.use((req, res) => {
  sendResponse(res, STATUS.NOT_FOUND, "Route not found");
});

// ---- Global error handler ----
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return sendResponse(res, err.statusCode, err.message, { error: err.message });
  }
  console.error(err.stack);
  sendResponse(res, STATUS.INTERNAL_SERVER_ERROR, "Something went wrong on the server", {
    error: err.message,
  });
});

const PORT = process.env.PORT || 5001;

// One-time bootstrap: the team roster used to be the hardcoded TEAM_DATA
// object served straight from GET /api/team. Now it's a real collection —
// on first run (empty collection) we seed it from TEAM_DATA so existing
// deployments don't lose their roster when they upgrade.
async function bootstrapTeam() {
  const count = await TeamMember.countDocuments();
  if (count > 0) return;
  const members = Object.entries(TEAM_DATA).map(([name, projects]) => ({
    name,
    projects,
  }));
  if (!members.length) return;
  await TeamMember.insertMany(members);
  console.log(
    `[Server] Seeded ${members.length} team members from teamData.js`,
  );
}

connectDB().then(async () => {
  await bootstrapTeam();
  app.listen(PORT, () =>
    console.log(`[Server] TaskPilot API listening on port ${PORT}`),
  );
});
