/**
 * Single response method. success is derived from statusCode (< 400 = true).
 *
 * Shape:
 * {
 *   success:    boolean,
 *   statusCode: number,
 *   message:    string,
 *   data:       object | null,   // named-key object e.g. { tasks } { task } { stats }
 *   error:      string | null,
 *   metadata:   object | null,   // extra context e.g. { count, range }
 * }
 */
const sendResponse = (res, statusCode, message, { data = null, error = null, metadata = null } = {}) => {
  const success = statusCode < 400;
  return res.status(statusCode).json({
    success,
    statusCode,
    message,
    data:     success ? (data ?? {}) : null,
    error:    success ? null : (error ?? message),
    metadata: metadata ?? null,
  });
};

module.exports = sendResponse;
