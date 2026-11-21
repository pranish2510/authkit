const mongoose = require("mongoose");
const auditLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  appId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", index: true },
  event: { type: String, required: true, index: true },
  targetType: String,
  targetId: String,
  ipAddress: String,
  userAgent: String,
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });
auditLogSchema.index({ createdAt: -1 });
module.exports = mongoose.model("AuditLog", auditLogSchema);
