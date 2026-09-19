const { verifyFirebaseToken } = require('./jwtValidator');
const { fetchAndValidateUser, validateRequiredRole } = require('./roleValidator');

/**
 * Authorization Manager: Complete verification workflow
 * 1. Verifies Firebase JWT
 * 2. Reads UID
 * 3. Reads Firestore users/{uid}
 * 4. Reads Role & Status
 * 5. Verifies Permissions
 * 6. Attaches authenticated user payload to express request
 */
async function authorizeRequest(req, requiredRole = null) {
  const authHeader = req.headers.authorization;
  const decodedToken = await verifyFirebaseToken(authHeader);

  // Read UID from verified JWT payload
  const uid = decodedToken.uid;

  // Read Firestore user document
  const user = await fetchAndValidateUser(uid);

  // Check required minimum role if specified
  if (requiredRole) {
    validateRequiredRole(user.role, requiredRole);
  }

  // Attach verified user to request object
  req.user = user;
  req.decodedToken = decodedToken;
  return user;
}

module.exports = {
  authorizeRequest
};
