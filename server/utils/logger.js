export function logError(error, context = "") {
  console.error(`[${new Date().toISOString()}] ${context}:`, error);
}
