/**
 * Validation utility functions
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} { isValid: boolean, errorKey: string | null }
 */
export const validatePassword = (password) => {
  // At least 8 characters
  if (password.length < 8) {
    return { isValid: false, errorKey: 'validation.password_min' };
  }

  // Cannot contain " or '
  if (password.includes('"') || password.includes("'")) {
    return { isValid: false, errorKey: 'auth.password_invalid_chars' };
  }

  // Must contain at least 2 of 3: letters, numbers, symbols
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[^a-zA-Z0-9]/.test(password);
  const count = [hasLetters, hasNumbers, hasSymbols].filter(Boolean).length;

  if (count < 2) {
    return { isValid: false, errorKey: 'auth.password_weak' };
  }

  return { isValid: true, errorKey: null };
};

