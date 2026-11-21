const { validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
  console.log("STEP A: Validation middleware reached");
  

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log("STEP B: Validation failed");

    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  console.log("STEP B: Validation passed");
  next();
};

module.exports = validateRequest;