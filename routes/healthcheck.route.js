const express = require("express");
const { verifyJWT } = require("../middleware/auth.middleware");
const { healthCheck } = require("../controller/healthcheck.controller");

const healthcheckRouter = express.Router();

healthcheckRouter.route("/healthcheck").get(verifyJWT, healthCheck);

module.exports = healthcheckRouter;
