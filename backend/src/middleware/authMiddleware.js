const { authorizeRequest } = require('../services/authorizationManager');
const { createErrorResponse } = require('../models/responseModels');

/**
 * Authentication Middleware
 * Enforces Firebase JWT verification and attaches req.user
 */
function authenticate() {
  return async (req, res, next) => {
    try {
      await authorizeRequest(req);
      next();
    } catch (error) {
      console.error('[AuthMiddleware] Authentication failed:', error.message);
      const statusCode = error.statusCode || 401;
      res.status(statusCode).json(createErrorResponse(error));
    }
  };
}

/**
 * Role Middleware
 * Enforces required minimum role (USER, DEVELOPER, ADMIN)
 */
function requireRole(requiredRole) {
  return async (req, res, next) => {
    try {
      await authorizeRequest(req, requiredRole);
      next();
    } catch (error) {
      console.error('[AuthMiddleware] Role check failed:', error.message);
      const statusCode = error.statusCode || 403;
      res.status(statusCode).json(createErrorResponse(error));
    }
  };
}

module.exports = {
  authenticate,
  requireRole
};
