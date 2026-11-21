
const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    appId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", default: undefined, index: true },

    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    familyId: {
      type: String,
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    revokedAt: {
      type: Date,
      default: null,
    },

    replacedByTokenHash: {
      type: String,
      default: null,
    },

    userAgent: {
      type: String,
      default: null,
    },

    ipAddress: {
      type: String,
      default: null,
    },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// MongoDB automatically deletes expired records.
refreshTokenSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);
refreshTokenSchema.index({ userId: 1, revokedAt: 1, expiresAt: 1 });

const RefreshToken = mongoose.model(
  "RefreshToken",
  refreshTokenSchema
);

module.exports = RefreshToken;
