const { generateRefreshToken, hashRefreshToken } = require("../utils/refreshToken");

describe("refresh-token utilities", () => {
  test("generates unique raw tokens and deterministic non-reversible hashes", () => {
    const first = generateRefreshToken();
    const second = generateRefreshToken();
    expect(first).toHaveLength(128);
    expect(first).not.toBe(second);
    expect(hashRefreshToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashRefreshToken(first)).toBe(hashRefreshToken(first));
    expect(hashRefreshToken(first)).not.toBe(first);
  });
});
