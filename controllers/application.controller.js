const crypto = require("crypto");
const Application = require("../models/application.model");
const ApiKey = require("../models/apiKey.model");
const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");
const { recordAudit } = require("../services/audit.service");
const owns = (app, user) => app.ownerId.toString() === user.id || ["admin", "superadmin"].includes(user.role);
const publicId = () => `app_${crypto.randomBytes(12).toString("base64url")}`;
const newSecret = () => { const prefix = `ak_${crypto.randomBytes(5).toString("hex")}`; return { prefix, raw: `${prefix}.${crypto.randomBytes(32).toString("base64url")}` }; };

const createApplication = catchAsync(async (req, res) => {
  if (req.user.role === "user") await User.updateOne({ _id: req.user.id }, { $set: { role: "developer" } });
  const app = await Application.create({ name: req.body.name, ownerId: req.user.id, publicId: publicId(), allowedCallbackUrls: req.body.allowedCallbackUrls || [], allowedOrigins: req.body.allowedOrigins || [], authSettings: req.body.authSettings || {} });
  const secret = newSecret();
  await ApiKey.create({ appId: app._id, label: "Default server key", prefix: secret.prefix, keyHash: crypto.createHash("sha256").update(secret.raw).digest("hex") });
  await recordAudit(req, "application.created", { targetType: "Application", targetId: app.id, appId: app._id });
  res.status(201).json({ success: true, message: "Application created. Copy the API key now; it is never shown again.", data: { application: app, apiKey: secret.raw } });
});
const listApplications = catchAsync(async (req, res) => {
  const filter = ["admin", "superadmin"].includes(req.user.role) ? {} : { ownerId: req.user.id };
  const applications = await Application.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: { applications } });
});
const getApplication = catchAsync(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application || !owns(application, req.user)) throw new AppError("Application not found", 404);
  res.json({ success: true, data: { application } });
});
const updateApplication = catchAsync(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application || !owns(application, req.user)) throw new AppError("Application not found", 404);
  ["name", "allowedCallbackUrls", "allowedOrigins", "authSettings", "status"].forEach((field) => { if (req.body[field] !== undefined) application[field] = req.body[field]; });
  await application.save(); await recordAudit(req, "application.updated", { targetType: "Application", targetId: application.id, appId: application._id });
  res.json({ success: true, data: { application } });
});
const createApiKey = catchAsync(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application || !owns(application, req.user)) throw new AppError("Application not found", 404);
  const secret = newSecret();
  const key = await ApiKey.create({ appId: application._id, label: req.body.label || "API key", prefix: secret.prefix, keyHash: crypto.createHash("sha256").update(secret.raw).digest("hex") });
  await recordAudit(req, "api_key.created", { targetType: "ApiKey", targetId: key.id, appId: application._id });
  res.status(201).json({ success: true, message: "Copy this API key now; it is never shown again.", data: { apiKey: secret.raw, key: { id: key.id, label: key.label, prefix: key.prefix, createdAt: key.createdAt } } });
});
const listApiKeys = catchAsync(async (req, res) => { const application = await Application.findById(req.params.id); if (!application || !owns(application, req.user)) throw new AppError("Application not found", 404); const keys = await ApiKey.find({ appId: application._id }).select("label prefix lastUsedAt revokedAt createdAt"); res.json({ success: true, data: { keys } }); });
const revokeApiKey = catchAsync(async (req, res) => { const key = await ApiKey.findById(req.params.keyId); if (!key) throw new AppError("API key not found", 404); const application = await Application.findById(key.appId); if (!owns(application, req.user)) throw new AppError("Application not found", 404); key.revokedAt = new Date(); await key.save(); await recordAudit(req, "api_key.revoked", { targetType: "ApiKey", targetId: key.id, appId: application._id }); res.json({ success: true, message: "API key revoked" }); });
module.exports = { createApplication, listApplications, getApplication, updateApplication, createApiKey, listApiKeys, revokeApiKey };
