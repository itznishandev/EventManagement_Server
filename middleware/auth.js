const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET =
  process.env.JWT_SECRET || "uddog_jwt_secret_key_2026_b14a8_hermione_secure";

function signToken(payload) {
  return jwt.sign(
    {
      email: payload.email.toLowerCase().trim(),
      name: payload.name || payload.displayName || "",
      uid: payload.uid || payload._id?.toString() || "",
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function verifyToken(req, res, next) {
  try {
    let token = null;

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.uddog_token) {
      token = req.cookies.uddog_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access: JWT token is required.",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Forbidden access: Invalid or expired JWT token.",
    });
  }
}

module.exports = {
  JWT_SECRET,
  signToken,
  verifyToken,
};
