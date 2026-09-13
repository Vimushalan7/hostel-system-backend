const { validationResult } = require('express-validator');
const { sendError } = require('../utils/responseHelper');

/**
 * Validation middleware — aggregates express-validator errors and sends a 400 response.
 * Place this after express-validator chains in route definitions.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed. Please check your input.',
      errors: errorMessages,
    });
  }

  next();
};

module.exports = { validate };
