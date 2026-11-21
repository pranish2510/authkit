
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters"],
      maxlength: [80, "Name cannot exceed 80 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    appId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", default: undefined, index: true },

    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
      select: false,
    },

    role: {
      type: String,
      enum: ["user", "developer", "admin", "superadmin"],
      default: "user",
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    passwordChangedAt: Date,
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    googleId: { type: String, sparse: true, unique: true },
  },
  {
    timestamps: true,

    toJSON: {
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Enforce unique email addresses at database level.
// Existing legacy accounts retain an undefined appId; new application users are tenant-isolated.
userSchema.index({ appId: 1, email: 1 }, { unique: true, partialFilterExpression: { appId: { $exists: true } } });

const User = mongoose.model("User", userSchema);

module.exports = User;
