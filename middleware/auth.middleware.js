const AppError = require("../utils/AppError");
const { verifyAccessToken } = require("../utils/token");
const User = require("../models/user.model");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("Authentication required", 401);
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            throw new AppError("Authentication required", 401);
        }

        const decoded = verifyAccessToken(token);

        const user = await User.findById(decoded.sub).select("_id role status appId passwordChangedAt");
        if (!user || user.status === "disabled") throw new AppError("Account is unavailable", 401);
        if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) throw new AppError("Session is no longer valid", 401);
        req.user = { id: user._id.toString(), role: user.role, appId: user.appId?.toString() };

        next();
    } catch (error) {
        if (error instanceof AppError) {
            return next(error);
        }

        return next(new AppError("Invalid or expired token", 401));
    }
};

const authorize = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : next(new AppError("You do not have permission to perform this action", 403));

module.exports = { protect, authorize };
