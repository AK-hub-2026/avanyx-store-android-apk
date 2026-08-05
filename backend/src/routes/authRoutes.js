const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { authorizeRequest } = require('../services/authorizationManager');
const { createSuccessResponse, createErrorResponse } = require('../models/responseModels');

/**
 * GET /api/auth/me
 * Returns authenticated user metadata (UID, Display Name, Email, Role, Developer Status, Account Status)
 */
router.get('/me', authenticate(), (req, res) => {
  try {
    const user = req.user;
    res.json(createSuccessResponse({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      developerStatus: user.role === 'DEVELOPER' || user.role === 'ADMIN' ? 'APPROVED' : 'NONE',
      accountStatus: user.status,
      developerId: user.developerId,
      permissions: user.permissions
    }, 'User credentials authenticated successfully'));
  } catch (error) {
    res.status(500).json(createErrorResponse(error));
  }
});

/**
 * POST /api/auth/verify
 * Explicitly verifies Firebase JWT passed in body or header.
 * Returns Success, UID, Role, Permissions
 */
router.post('/verify', async (req, res) => {
  try {
    let authHeader = req.headers.authorization;
    if ((!authHeader || !authHeader.startsWith('Bearer ')) && req.body && req.body.idToken) {
      authHeader = `Bearer ${req.body.idToken}`;
      req.headers.authorization = authHeader;
    }

    const user = await authorizeRequest(req);
    res.json(createSuccessResponse({
      verified: true,
      uid: user.uid,
      role: user.role,
      permissions: user.permissions,
      email: user.email,
      displayName: user.displayName,
      accountStatus: user.status
    }, 'Firebase JWT verified successfully'));
  } catch (error) {
    const statusCode = error.statusCode || 401;
    res.status(statusCode).json(createErrorResponse(error));
  }
});

module.exports = router;
