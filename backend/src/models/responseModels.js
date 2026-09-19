function createSuccessResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    timestamp: Date.now(),
    data
  };
}

function createErrorResponse(error) {
  return {
    success: false,
    code: error.code || 'INTERNAL_SERVER_ERROR',
    message: error.message || 'An unexpected error occurred',
    timestamp: error.timestamp || Date.now(),
    details: error.details || null
  };
}

module.exports = {
  createSuccessResponse,
  createErrorResponse
};
