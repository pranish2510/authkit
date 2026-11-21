
const User = require("../models/user.model");
const AppError = require("../utils/AppError");
const catchAsync = require("../utils/catchAsync");

const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError("User no longer exists", 401);
  }

  res.status(200).json({
    success: true,
    data: {
      user: user.toJSON(),
    },
  });
});

const updateMe = catchAsync(async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name.trim();
  if (!Object.keys(updates).length) throw new AppError("No supported fields provided", 400);
  const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true, runValidators: true });
  res.status(200).json({ success: true, data: { user: user.toJSON() } });
});

module.exports = { getMe, updateMe };
