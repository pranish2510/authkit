const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;

  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,

    message: dbConnected
      ? "AuthKit API is healthy"
      : "Database connection unavailable",

    database: dbConnected ? "connected" : "disconnected",

    timestamp: new Date().toISOString(),
  });
});

module.exports = router;