const AppError = require("./AppError");

/**
 * Parses and validates data against a Zod schema.
 * Throws AppError.badRequest with the first error message on failure.
 * Returns the parsed (coerced + stripped) data on success.
 */
function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid input";
    throw AppError.badRequest(message);
  }
  return result.data;
}

module.exports = validate;
