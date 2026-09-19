class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
  }
}

class MissingTokenError extends ApiError {
  constructor(message = 'Authorization Bearer token is missing') {
    super(401, 'MISSING_TOKEN', message);
  }
}

class InvalidTokenError extends ApiError {
  constructor(message = 'Invalid Firebase ID token signature or format') {
    super(401, 'INVALID_TOKEN', message);
  }
}

class ExpiredTokenError extends ApiError {
  constructor(message = 'Firebase ID token has expired') {
    super(401, 'EXPIRED_TOKEN', message);
  }
}

class UserMissingError extends ApiError {
  constructor(uid) {
    super(404, 'USER_MISSING', `User record with UID ${uid} not found in Firestore users/{uid}`);
  }
}

class InactiveAccountError extends ApiError {
  constructor(uid) {
    super(403, 'INACTIVE_ACCOUNT', `User account ${uid} is disabled or inactive`);
  }
}

class RoleMissingError extends ApiError {
  constructor(uid) {
    super(403, 'ROLE_MISSING', `User account ${uid} does not have a valid role assigned`);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Access denied due to insufficient permissions for your role') {
    super(403, 'FORBIDDEN', message);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required') {
    super(401, 'UNAUTHORIZED', message);
  }
}

module.exports = {
  ApiError,
  MissingTokenError,
  InvalidTokenError,
  ExpiredTokenError,
  UserMissingError,
  InactiveAccountError,
  RoleMissingError,
  ForbiddenError,
  UnauthorizedError
};
