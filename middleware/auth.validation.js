
const { body } = require("express-validator");

const registerValidation = [
  body("name")
    .exists()
    .withMessage("Name is required")
    .bail()
    .isString()
    .withMessage("Name must be a string")
    .bail()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Name must be between 2 and 80 characters"),

  body("email")
    .exists()
    .withMessage("Email is required")
    .bail()
    .isString()
    .withMessage("Email must be a string")
    .bail()
    .trim()
    .isEmail()
    .withMessage("Email must be a valid email")
    .bail()
    .normalizeEmail(),

  body("password")
    .exists()
    .withMessage("Password is required")
    .bail()
    .isString()
    .withMessage("Password must be a string")
    .bail()
    .isStrongPassword({
      minLength: 12,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be at least 12 characters long and contain uppercase, lowercase, a number and a symbol"
    )
    .bail()
    .custom((password) => {
      if (Buffer.byteLength(password, "utf8") > 72) {
        throw new Error("Password cannot exceed 72 UTF-8 bytes");
      }
      return true;
    }),
];


const loginValidation = [
  body("email")
    .exists()
    .withMessage("Email is required")
    .bail()
    .isString()
    .withMessage("Email must be a string")
    .bail()
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email")
    .bail()
    .normalizeEmail(),

  body("password")
    .exists()
    .withMessage("Password is required")
    .bail()
    .isString()
    .withMessage("Password must be a string")
    .bail()
    .notEmpty()
    .withMessage("Password cannot be empty"),
];

const passwordRule = (field) => body(field).isString().isStrongPassword({ minLength: 12, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 }).withMessage("Password must be at least 12 characters and include uppercase, lowercase, number and symbol").bail().custom((value) => Buffer.byteLength(value, "utf8") <= 72).withMessage("Password cannot exceed 72 UTF-8 bytes");
const emailValidation = [body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email")];
const tokenValidation = [body("token").isString().isLength({ min: 32, max: 200 }).withMessage("Invalid token")];
const resetValidation = [...tokenValidation, passwordRule("password")];
const changePasswordValidation = [body("currentPassword").isString().notEmpty().withMessage("Current password is required"), passwordRule("newPassword")];

module.exports = { registerValidation, loginValidation, emailValidation, tokenValidation, resetValidation, changePasswordValidation };
