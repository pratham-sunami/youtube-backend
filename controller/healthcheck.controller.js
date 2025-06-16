const { apiResponse } = require("../utils/apiResponse");
const { asyncHandler } = require("../utils/asyncHandler");

const healthCheck = asyncHandler(async (req, res) => {
  return res.status(200).json(new apiResponse(200, {}, "OK"));
});

module.exports = {
  healthCheck,
};
