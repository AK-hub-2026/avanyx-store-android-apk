const { db } = require('../config/firebaseAdmin');
const { UserMissingError, InactiveAccountError, RoleMissingError, ForbiddenError } = require('../models/exceptionModels');

// Defined permissions for each Role
const ROLE_PERMISSIONS = {
  USER: ['read:apps', 'read:reviews', 'create:review', 'manage:wishlist', 'manage:downloads'],
  DEVELOPER: ['read:apps', 'read:reviews', 'create:review', 'manage:wishlist', 'manage:downloads', 'create:app', 'update:own_app', 'read:analytics'],
  ADMIN: ['read:apps', 'read:reviews', 'create:review', 'manage:wishlist', 'manage:downloads', 'create:app', 'update:own_app', 'read:analytics', 'manage:users', 'approve:apps', 'manage:roles', 'admin:all']
};

/**
 * Reads user record from Firestore collection `users/{uid}`.
 * NEVER trusts roles passed in Android client payloads.
 */
async function fetchAndValidateUser(uid) {
  if (!uid) {
    throw new UserMissingError('Empty UID provided');
  }

  const userDoc = await db().collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new UserMissingError(uid);
  }

  const userData = userDoc.data();

  // Verify account status (active vs disabled/suspended)
  if (userData.status && userData.status.toUpperCase() !== 'ACTIVE') {
    throw new InactiveAccountError(uid);
  }

  // Verify Role exists and is valid
  const role = (userData.role || 'USER').toUpperCase();
  if (!ROLE_PERMISSIONS[role]) {
    throw new RoleMissingError(uid);
  }

  return {
    uid,
    role,
    status: userData.status || 'ACTIVE',
    developerId: userData.developerId || '',
    email: userData.email || '',
    displayName: userData.displayName || '',
    createdAt: userData.createdAt || 0,
    updatedAt: userData.updatedAt || 0,
    permissions: ROLE_PERMISSIONS[role]
  };
}

/**
 * Validates if user role satisfies required minimum role
 */
function validateRequiredRole(userRole, requiredRole) {
  const roleHierarchy = { USER: 1, DEVELOPER: 2, ADMIN: 3 };
  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 99;

  if (userLevel < requiredLevel) {
    throw new ForbiddenError(`Action requires ${requiredRole} role. Current role: ${userRole}`);
  }
}

module.exports = {
  ROLE_PERMISSIONS,
  fetchAndValidateUser,
  validateRequiredRole
};
