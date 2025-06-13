/**
 * Validate a message's content.
 * A valid message must be non-empty and have a maximum length of 500 characters.
 * @param {string} msg - The message to validate.
 * @returns {boolean} True if the message is valid, false otherwise.
 */
export function isValidMessage(msg) {
  const trimmed = msg.trim();
  return trimmed.length > 0 && trimmed.length <= 500;
}

/**
 * Validate a username.
 * A valid username must be 3-20 characters long and consist of alphanumeric characters or underscores.
 * @param {string} name - The username to validate.
 * @returns {boolean} True if the username is valid, false otherwise.
 */
export function isValidUsername(name) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(name.trim());
}

/**
 * Validate a search term.
 * A valid search term must have a maximum length of 50 characters.
 * @param {string} term - The search term to validate.
 * @returns {boolean} True if the search term is valid, false otherwise.
 */
export function isValidSearchTerm(term) {
  return term.trim().length <= 50;
}
