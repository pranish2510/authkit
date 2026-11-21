
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  console.error("ERROR:", err.message);

  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500 && process.env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message || "Something went wrong",

    ...(process.env.NODE_ENV !== "production" && {
      stack: err.stack,
    }),
  });
};

module.exports = errorHandler;
