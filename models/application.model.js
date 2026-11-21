const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  publicId: { type: String, required: true, unique: true, index: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  allowedCallbackUrls: [{ type: String, trim: true }],
  allowedOrigins: [{ type: String, trim: true }],
  status: { type: String, enum: ["active", "disabled"], default: "active" },
  authSettings: { requireEmailVerification: { type: Boolean, default: true }, allowGoogleOAuth: { type: Boolean, default: true } },
}, { timestamps: true });
applicationSchema.index({ ownerId: 1, createdAt: -1 });
module.exports = mongoose.model("Application", applicationSchema);
