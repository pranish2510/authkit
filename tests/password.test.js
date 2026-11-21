
const {
  hashPassword,
  comparePassword,
} = require("../utils/password");

describe("password utilities", () => {
  test("hashes a password and verifies only the correct value", async () => {
  const password = "MyStrongPassword123!";

  // Generate password hash
  const hashedPassword = await hashPassword(password);

  expect(hashedPassword).not.toBe(password);

  // Correct password
  const correctPassword = await comparePassword(
    password,
    hashedPassword
  );

  // Incorrect password
  const incorrectPassword = await comparePassword(
    "WrongPassword123!",
    hashedPassword
  );

  expect(correctPassword).toBe(true);
  expect(incorrectPassword).toBe(false);
  });
});
