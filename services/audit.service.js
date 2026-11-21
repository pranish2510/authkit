const AuditLog = require("../models/auditLog.model");
const recordAudit = (req, event, details = {}) => AuditLog.create({
  actorId: req.user?.id,
  appId: req.application?._id || details.appId,
  event,
  targetType: details.targetType,
  targetId: details.targetId,
  ipAddress: req.ip,
  userAgent: req.get("user-agent"),
  metadata: details.metadata || {},
}).catch(() => undefined);
module.exports = { recordAudit };
