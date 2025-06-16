const User = require("../model/user.model");
const { asyncHandler } = require("../utils/asyncHandler");
const jwt = require("jsonwebtoken");
const { apiError } = require("../utils/apiError");

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new apiError(401, "unauthorized action");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN);
    const userId = decodedToken.id;

    const user = await User.findById(userId).select("-password -refreshToken");

    if (!user) {
      throw new apiError(401, "Invalid access token");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new apiError(501, error);
  }
});

module.exports = { verifyJWT };
