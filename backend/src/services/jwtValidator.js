const { auth } = require('../config/firebaseAdmin');
const { MissingTokenError, InvalidTokenError, ExpiredTokenError } = require('../models/exceptionModels');

/**
 * Extracts and verifies Firebase JWT ID Token from request headers.
 * NEVER trusts client claims without verification.
 * Automatically checks token expiration and revocation.
 */
async function verifyFirebaseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new MissingTokenError('Authorization header missing or format invalid. Expected "Bearer <token>"');
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!token) {
    throw new MissingTokenError('Token string is empty');
  }

  try {
    // Verify ID Token with Firebase Admin SDK, enforce checkRevoked = true
    const decodedToken = await auth().verifyIdToken(token, true);
    return decodedToken;
  } catch (error) {
    console.error('[JWTValidator] Token verification failed:', error.code, error.message);
    if (error.code === 'auth/id-token-expired') {
      throw new ExpiredTokenError('Firebase ID Token has expired. Please refresh token on Android client.');
    } else if (error.code === 'auth/id-token-revoked') {
      throw new InvalidTokenError('Firebase ID Token has been revoked. Re-authentication required.');
    } else {
      throw new InvalidTokenError(`Invalid Firebase ID Token: ${error.message}`);
    }
  }
}

module.exports = {
  verifyFirebaseToken
};
