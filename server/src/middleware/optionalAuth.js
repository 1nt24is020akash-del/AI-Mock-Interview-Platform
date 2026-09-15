const jwt = require("jsonwebtoken");

/**
 * Optional authentication middleware.
 * Attaches req.userId if a valid JWT is provided in headers,
 * but allows the request to proceed as a guest if no token is present.
 */
const optionalProtect = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = header.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET || "supersecretjwtkey_ai_assistant_2026";
    const decoded = jwt.verify(token, jwtSecret);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    // If a malformed or expired token was explicitly provided, notify client
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "The provided authentication token is invalid or expired.",
      },
    });
  }
};

module.exports = { optionalProtect };
