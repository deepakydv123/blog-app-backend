const express = require("express");
const { sendEmailMsgCtrl } = require("../controllers/emailMsg/emailMgsCtrl");
const authMiddleware = require("../middlewares/auth/authMiddleware");
const emailMsgRoute = express.Router();

emailMsgRoute.post("/", authMiddleware, sendEmailMsgCtrl);

module.exports = emailMsgRoute;
