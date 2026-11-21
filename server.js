const app = require("./app");
const connectDB = require("./config/db");

const { PORT } = require("./config/env");

const startServer = async () => {
  try {
    // Connect database before accepting requests
    await connectDB();

    app.listen(PORT, () => {
      console.log(`AuthKit running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();