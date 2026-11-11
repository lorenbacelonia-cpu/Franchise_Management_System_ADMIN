/**
 * Form Validation and Input Sanitization Utilities
 * Enforces strict validation rules:
 * - Contact numbers: Numbers only, no letters, no special characters (11 digits starting with 09)
 * - Names: Letters only, no numbers, no special characters
 * - Addresses, routes, codes: No disallowed special characters
 * - Form submission prevention if inputs are incorrect or missing
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Checks if a key event is a navigation/control key (arrows, backspace, tab, enter, ctrl/cmd shortcuts)
 */
export function isControlKey(e: React.KeyboardEvent<HTMLInputElement>): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  return [
    'Backspace',
    'Delete',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Tab',
    'Enter',
    'Home',
    'End',
    'Escape'
  ].includes(e.key);
}

/**
 * Prevents typing any non-digit character (e.g. for contact numbers, age)
 */
export function preventNonDigits(e: React.KeyboardEvent<HTMLInputElement>): void {
  if (isControlKey(e)) return;
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
}

/**
 * Prevents typing numbers and special characters for name fields (letters, spaces, periods, hyphens only)
 */
export function preventSpecialCharsForName(e: React.KeyboardEvent<HTMLInputElement>): void {
  if (isControlKey(e)) return;
  if (!/^[a-zA-ZñÑ\s.'-]$/.test(e.key)) {
    e.preventDefault();
  }
}

/**
 * Prevents typing disallowed special characters in address fields
 * Disallowed: !@$%^&*()_+~`={}[];:"<>?|\
 */
export function preventSpecialCharsForAddress(e: React.KeyboardEvent<HTMLInputElement>): void {
  if (isControlKey(e)) return;
  if (!/^[a-zA-Z0-9ñÑ\s.,#/-]$/.test(e.key)) {
    e.preventDefault();
  }
}

/**
 * Prevents typing disallowed special characters in code fields (Plate No, Application No, Receipt No)
 * Allowed: letters, numbers, hyphens only
 */
export function preventSpecialCharsForCode(e: React.KeyboardEvent<HTMLInputElement>): void {
  if (isControlKey(e)) return;
  if (!/^[a-zA-Z0-9-]$/.test(e.key)) {
    e.preventDefault();
  }
}

/**
 * Prevents typing disallowed special characters in route fields
 */
export function preventSpecialCharsForRoute(e: React.KeyboardEvent<HTMLInputElement>): void {
  if (isControlKey(e)) return;
  if (!/^[a-zA-Z0-9ñÑ\s.,()/#-]$/.test(e.key)) {
    e.preventDefault();
  }
}

/**
 * Strips all non-digit characters from a string and limits length
 */
export function cleanDigitsOnly(str: string, maxLength: number = 11): string {
  if (!str) return '';
  return str.replace(/\D/g, '').slice(0, maxLength);
}

/**
 * Strips numbers and special characters from names (allows letters, spaces, hyphens, periods)
 */
export function cleanName(str: string): string {
  if (!str) return '';
  return str.replace(/[^a-zA-ZñÑ\s.'-]/g, '');
}

/**
 * Strips disallowed special characters from address
 */
export function cleanAddress(str: string): string {
  if (!str) return '';
  return str.replace(/[^a-zA-Z0-9ñÑ\s.,#/-]/g, '');
}

/**
 * Strips disallowed special characters from code strings (Plate, Application No, OR No)
 */
export function cleanCode(str: string): string {
  if (!str) return '';
  return str.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
}

/**
 * Strips disallowed special characters from routes
 */
export function cleanRoute(str: string): string {
  if (!str) return '';
  return str.replace(/[^a-zA-Z0-9ñÑ\s.,()/#-]/g, '');
}

/**
 * Strips disallowed special characters from vehicle model / color
 */
export function cleanModelOrColor(str: string): string {
  if (!str) return '';
  return str.replace(/[^a-zA-Z0-9ñÑ\s./-]/g, '');
}

/**
 * Contact Number Validator:
 * - Only numbers allowed (no letters, no special characters)
 * - Required field check
 * - Must be an 11-digit Philippine mobile number starting with 09
 */
export function validateContactNumber(contact: string, required = true): ValidationResult {
  const trimmed = (contact || '').trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: 'Mobile / Contact number is required.' };
    }
    return { isValid: true };
  }

  if (/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Letters are not allowed in contact number. Numbers only.' };
  }

  if (/[^0-9]/.test(trimmed)) {
    return { isValid: false, error: 'Special characters are not allowed. Numbers only.' };
  }

  if (trimmed.length !== 11) {
    return { isValid: false, error: `Must be exactly 11 digits (current: ${trimmed.length} digits).` };
  }

  if (!trimmed.startsWith('09')) {
    return { isValid: false, error: 'Must start with 09 (e.g. 09171234567).' };
  }

  return { isValid: true };
}

/**
 * Name Validator (Owner, Driver, Beneficiary):
 * - Letters, spaces, periods, hyphens only
 * - No numbers, no special characters
 */
export function validateName(name: string, fieldLabel: string, required = true): ValidationResult {
  const trimmed = (name || '').trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: `${fieldLabel} is required.` };
    }
    return { isValid: true };
  }

  if (/[0-9]/.test(trimmed)) {
    return { isValid: false, error: `Numbers are not allowed in ${fieldLabel}. Letters only.` };
  }

  if (/[!@#$%^&*()_+~`={}[\];:"<>?,/|\\]/.test(trimmed)) {
    return { isValid: false, error: `Special characters are not allowed in ${fieldLabel}.` };
  }

  if (!/^[a-zA-ZñÑ\s.'-]+$/.test(trimmed)) {
    return { isValid: false, error: `${fieldLabel} must contain letters only.` };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: `${fieldLabel} must be at least 2 characters.` };
  }

  return { isValid: true };
}

/**
 * Address Validator:
 * - No special characters like @#$%^&*+=~_<>{}[]|;:"?!
 */
export function validateAddress(address: string, fieldLabel: string, required = true): ValidationResult {
  const trimmed = (address || '').trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: `${fieldLabel} is required.` };
    }
    return { isValid: true };
  }

  if (/[!@$%^&*()_+~`={}[\];:"<>?|\\]/.test(trimmed)) {
    return { isValid: false, error: `Special characters are not allowed in ${fieldLabel}.` };
  }

  if (!/^[a-zA-Z0-9ñÑ\s.,#/-]+$/.test(trimmed)) {
    return { isValid: false, error: `${fieldLabel} contains invalid characters.` };
  }

  if (trimmed.length < 5) {
    return { isValid: false, error: `${fieldLabel} must be at least 5 characters.` };
  }

  return { isValid: true };
}

/**
 * Age Validator:
 * - Numbers only, between 18 and 100
 */
export function validateAge(age: string, required = true): ValidationResult {
  const trimmed = (age || '').trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: 'Age is required.' };
    }
    return { isValid: true };
  }

  if (/[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: 'Letters are not allowed in age. Numbers only.' };
  }

  if (!/^\d+$/.test(trimmed)) {
    return { isValid: false, error: 'Special characters are not allowed in age. Numbers only.' };
  }

  const num = parseInt(trimmed, 10);
  if (isNaN(num) || num < 18 || num > 100) {
    return { isValid: false, error: 'Age must be between 18 and 100.' };
  }

  return { isValid: true };
}

/**
 * Code Validator (Plate Number, Application Number, Receipt Number):
 * - Letters, numbers, hyphens only
 * - No special characters, no spaces
 */
export function validateCode(code: string, fieldLabel: string, required = true): ValidationResult {
  const trimmed = (code || '').trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: `${fieldLabel} is required.` };
    }
    return { isValid: true };
  }

  if (/\s/.test(trimmed)) {
    return { isValid: false, error: `Spaces are not allowed in ${fieldLabel}.` };
  }

  if (!/^[a-zA-Z0-9-]+$/.test(trimmed)) {
    return { isValid: false, error: `Special characters are not allowed in ${fieldLabel}. Use letters, numbers, and hyphens only.` };
  }

  return { isValid: true };
}

/**
 * Route / Parada Validator:
 * - Letters, numbers, spaces, hyphens, slashes, periods, parentheses only
 */
export function validateRoute(route: string, fieldLabel: string, required = true): ValidationResult {
  const trimmed = (route || '').trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: `${fieldLabel} is required.` };
    }
    return { isValid: true };
  }

  if (/[!@#$%^*_+=~`={}[\];:"<>?|\\]/.test(trimmed)) {
    return { isValid: false, error: `Special characters are not allowed in ${fieldLabel}.` };
  }

  if (!/^[a-zA-Z0-9ñÑ\s.,()/#-]+$/.test(trimmed)) {
    return { isValid: false, error: `${fieldLabel} contains invalid characters.` };
  }

  return { isValid: true };
}

/**
 * Model / Make or Color Validator:
 * - Letters, numbers, spaces, hyphens, slashes only
 */
export function validateModelOrColor(value: string, fieldLabel: string, required = true): ValidationResult {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: `${fieldLabel} is required.` };
    }
    return { isValid: true };
  }

  if (/[!@#$%^*_+=~`={}[\];:"<>?|\\]/.test(trimmed)) {
    return { isValid: false, error: `Special characters are not allowed in ${fieldLabel}.` };
  }

  return { isValid: true };
}

/**
 * Currency / Amount Validator:
 * - Numbers and optional decimal point only
 * - Greater than zero
 */
export function validateAmount(amount: string, fieldLabel: string, required = true): ValidationResult {
  const trimmed = (amount || '').trim().replace(/[₱Php\s,]/gi, '');
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: `${fieldLabel} is required.` };
    }
    return { isValid: true };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return { isValid: false, error: `${fieldLabel} must be a valid number (e.g. 250.00). Special characters not allowed.` };
  }

  const num = parseFloat(trimmed);
  if (isNaN(num) || num <= 0) {
    return { isValid: false, error: `${fieldLabel} must be greater than zero.` };
  }

  return { isValid: true };
}

/**
 * Date Validator:
 * - Valid YYYY-MM-DD date string
 */
export function validateDate(dateStr: string, fieldLabel: string, required = true): ValidationResult {
  const trimmed = (dateStr || '').trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: `${fieldLabel} is required.` };
    }
    return { isValid: true };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return { isValid: false, error: `${fieldLabel} must be a valid date.` };
  }

  return { isValid: true };
}
