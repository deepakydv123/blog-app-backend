const jwt = require("jsonwebtoken");

// ######################
// ## Generate the web token for the user to login using id
// ############
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

module.exports = generateToken;
