export function isValidMessage(msg) {
  const trimmed = msg.trim();
  return trimmed.length > 0 && trimmed.length <= 500;
}

export function isValidUsername(name) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(name.trim());
}

export function isValidSearchTerm(term) {
  return term.trim().length <= 50;
}
