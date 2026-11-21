const User = require("../models/user.model");
const Application = require("../models/application.model");
const AuditLog = require("../models/auditLog.model");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { logoutAllUserSessions } = require("../services/auth.service");
const pagination = (req) => ({ page: Math.max(Number(req.query.page) || 1, 1), limit: Math.min(Math.max(Number(req.query.limit) || 20, 1), 100) });
const overview = catchAsync(async (req, res) => {
  const [users, applications, activeUsers] = await Promise.all([User.countDocuments(), Application.countDocuments(), User.countDocuments({ status: "active" })]);
  res.json({ success: true, data: { users, activeUsers, applications } });
});
const listUsers = catchAsync(async (req, res) => { const { page, limit } = pagination(req); const query = req.query.q ? { $or: [{ email: new RegExp(req.query.q, "i") }, { name: new RegExp(req.query.q, "i") }] } : {}; const [users, total] = await Promise.all([User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), User.countDocuments(query)]); res.json({ success: true, data: { users, page, total } }); });
const setUserStatus = catchAsync(async (req, res) => { const user = await User.findById(req.params.id); if (!user) throw new AppError("User not found", 404); if (user.role === "superadmin" && req.user.role !== "superadmin") throw new AppError("Cannot modify a superadmin", 403); user.status = req.body.status; await user.save(); if (user.status === "disabled") await logoutAllUserSessions(user._id); res.json({ success: true, data: { user } }); });
const auditLogs = catchAsync(async (req, res) => { const { page, limit } = pagination(req); const query = req.query.event ? { event: req.query.event } : {}; const [logs, total] = await Promise.all([AuditLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit), AuditLog.countDocuments(query)]); res.json({ success: true, data: { logs, page, total } }); });
module.exports = { overview, listUsers, setUserStatus, auditLogs };
