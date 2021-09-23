const jwt = require("jsonwebtoken");

async function check(token) {
  try {
    const decodedToken = jwt.verify(token, "trytoguessthis");
    return decodedToken.email;
  } catch (error) {
    return "Unauthorized";
  }
}

module.exports = { check };
