require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const connectDB  = require("./config/db");
const taskRoutes = require("./routes/taskRoutes");
const teamRoutes = require("./routes/teamRoutes");
const AppError     = require("./utils/AppError");
const sendResponse = require("./utils/response");
const STATUS       = require("./utils/statusCodes");

const app = express();

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
  sendResponse(res, STATUS.OK, "TaskPilot API is running");
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

connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`[Server] TaskPilot API listening on port ${PORT}`),
  );
});
