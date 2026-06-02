const { z } = require("zod");

/**
 * Higher-order middleware to validate incoming request data using Zod.
 * @param {Object} schemas - Object containing Zod schemas for body, query, and params.
 */
const validate = (schemas) => async (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = await schemas.body.parseAsync(req.body);
    }
    if (schemas.query) {
      req.query = await schemas.query.parseAsync(req.query);
    }
    if (schemas.params) {
      req.params = await schemas.params.parseAsync(req.params);
    }
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: formattedErrors,
      });
    }
    next(error);
  }
};

module.exports = validate;
