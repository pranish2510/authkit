const mongoose = require("mongoose");
const apiKeySchema = new mongoose.Schema({
  appId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
  label: { type: String, required: true, trim: true, maxlength: 80 },
  prefix: { type: String, required: true, index: true },
  keyHash: { type: String, required: true, select: false },
  lastUsedAt: Date,
  revokedAt: Date,
}, { timestamps: true });
apiKeySchema.index({ appId: 1, prefix: 1 }, { unique: true });
module.exports = mongoose.model("ApiKey", apiKeySchema);
