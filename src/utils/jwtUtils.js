const jwt = require('jsonwebtoken');

/**
 * Signs a JWT with the user's ID and role.
 * Role is included for convenience, but ALWAYS re-verified from DB in the auth middleware.
 */
const signToken = (userId, role) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!secret || secret.includes('replace')) {
    throw new Error('JWT_SECRET is not properly configured in environment variables.');
  }

  return jwt.sign(
    {
      userId: userId.toString(),
      role, // Convenience only — always reloaded from DB
      iss: 'hostel-system-api',
      aud: 'hostel-system-app',
    },
    secret,
    { expiresIn }
  );
};

/**
 * Verifies a JWT and returns the decoded payload.
 * Throws if invalid or expired.
 */
const verifyToken = (token) => {
  const secret = process.env.JWT_SECRET;
  return jwt.verify(token, secret, {
    issuer: 'hostel-system-api',
    audience: 'hostel-system-app',
  });
};

/**
 * Decodes a token without verification (for logging purposes only).
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = { signToken, verifyToken, decodeToken };
