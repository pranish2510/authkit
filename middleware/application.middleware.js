const crypto = require("crypto");
const Application = require("../models/application.model");
const ApiKey = require("../models/apiKey.model");
const AppError = require("../utils/AppError");

const resolveApplication = async (req, res, next) => {
  try {
    const publicId = req.get("x-application-id");
    if (!publicId) throw new AppError("X-Application-Id header is required", 400);
    const application = await Application.findOne({ publicId, status: "active" });
    if (!application) throw new AppError("Application not found or disabled", 404);
    req.application = application;
    next();
  } catch (error) { next(error); }
};

const requireApiKey = async (req, res, next) => {
  try {
    const raw = req.get("x-api-key");
    if (!raw || !raw.startsWith("ak_")) throw new AppError("Valid API key is required", 401);
    const [prefix] = raw.split(".");
    const key = await ApiKey.findOne({ prefix, revokedAt: null }).select("+keyHash appId");
    const hash = crypto.createHash("sha256").update(raw).digest("hex");
    if (!key || hash.length !== key.keyHash.length || !crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(key.keyHash))) throw new AppError("Valid API key is required", 401);
    req.apiKey = key;
    await ApiKey.updateOne({ _id: key._id }, { $set: { lastUsedAt: new Date() } });
    next();
  } catch (error) { next(error); }
};
module.exports = { resolveApplication, requireApiKey };
