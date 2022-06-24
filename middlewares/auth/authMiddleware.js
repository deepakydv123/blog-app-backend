const expressAsyncHandler = require("express-async-handler");

const jwt = require("jsonwebtoken");
const User = require("./../../model/user/User");

const authMiddleware = expressAsyncHandler(async (req, res, next) => {
  let token;

  // Check if jwt token is present in header
  if (req?.headers?.authorization?.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1]; // Get the token from the header

      // Check if the token exists
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_KEY);

        const user = await User.findById(decoded?.id).select("-password"); // Do not attach password to the object
        req.user = user;
        next();
      }
    } catch (err) {
      throw new Error("JWT Token Invalid");
    }
  } else {
    throw new Error("There is no token attached to the header.");
  }
});

module.exports = authMiddleware;
