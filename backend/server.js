require("dns").setDefaultResultOrder("ipv4first");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
if (!process.env.TELEGRAM_BOT_TOKEN) {
  require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
}

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const logger = require("./utils/logger");

const { connectDB } = require("./services/dbService");
const { initBot } = require("./services/botService");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const presentationRoutes = require("./routes/presentationRoutes");
const miniAppRoutes = require("./routes/miniAppRoutes");

const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json());
app.use(morgan("dev", { stream: { write: (msg) => logger.info(msg.trim()) } }));

app.get("/status", (req, res) =>
  res.json({ status: "running", timestamp: new Date() }),
);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/presentations", presentationRoutes);
app.use("/api/miniapp", miniAppRoutes);

app.use(errorMiddleware);

const server = app.listen(PORT, () => {
  logger.info(`Backend API server running on port ${PORT}`);
});

// Safety net: log unexpected errors instead of letting them kill the process
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection: %O", reason);
});
process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception: %O", err);
});

const bot = process.env.TELEGRAM_BOT_TOKEN ? initBot() : null;

if (bot) {
  bot
    .launch()
    .then(() => logger.info("Telegram Bot launched successfully."))
    .catch((err) => logger.error("Failed to launch Telegram Bot: %O", err));
} else {
  logger.warn("TELEGRAM_BOT_TOKEN is missing – bot will not start.");
}

function shutdown() {
  logger.info("Shutting down server gracefully...");
  if (bot) {
    try {
      bot.stop("SIGINT");
      logger.info("Telegram Bot stopped.");
    } catch (e) {
      logger.error("Failed to stop Telegram Bot: %O", e);
    }
  }
  server.close(() => {
    logger.info("Express HTTP server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);