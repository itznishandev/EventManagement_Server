const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const authRoutes = require("./routes/authRoutes");
const eventRoutes = require("./routes/eventRoutes");
const joinRoutes = require("./routes/joinRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const { ensureUpcomingSeedData } = require("./data/seedEvents");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: function (origin, callback) {
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// Root & API status endpoint
const statusHandler = (req, res) => {
  res.status(200).json({
    success: true,
    platform: "Uddog — Social Development Events Platform API",
    version: "1.0.0",
    status: "operational",
    endpoints: {
      recentUpcoming: "GET /api/events/upcoming/recent",
      allUpcoming: "GET /api/events?search=&eventType=&sort=asc",
      eventDetails: "GET /api/events/:id",
      createEvent: "POST /api/events (JWT Protected)",
      updateEvent: "PUT /api/events/:id (JWT Protected)",
      deleteEvent: "DELETE /api/events/:id (JWT Protected)",
      joinEvent: "POST /api/events/:id/join (JWT Protected)",
      joinedEvents: "GET /api/joined-events (JWT Protected)",
      myEvents: "GET /api/my-events (JWT Protected)",
    },
  });
};

app.get("/", statusHandler);
app.get("/api", statusHandler);

// Mount API routes (support both /api prefixed and direct root paths)
app.use("/api", authRoutes);
app.use("/api", eventRoutes);
app.use("/api", joinRoutes);

app.use(authRoutes);
app.use(eventRoutes);
app.use(joinRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, async () => {
    try {
      await ensureUpcomingSeedData();
      console.log(`Uddog API Server listening on http://localhost:${PORT}`);
    } catch (err) {
      console.error("Initial seed check warning:", err.message);
    }
  });
}

module.exports = app;

