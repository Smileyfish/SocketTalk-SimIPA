/**
 * Log an error to the console with a timestamp and optional context.
 * @param {Error} error - The error object to log.
 * @param {string} [context=""] - Optional context or description for the error.
 */
export function logError(error, context = "") {
  console.error(`[${new Date().toISOString()}] ${context}:`, error);
}
