export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const zipCodeRegex = /^\d{5}(-\d{4})?$/;
export const phoneRegex = /^[+]?[(]?[0-9]{1,3}[)]?[-\s./]?[(]?[0-9]{1,4}[)]?[-\s./]?[0-9]{1,4}[-\s./]?[0-9]{1,9}$/;

export function sanitizeInput(input: string): string {
  if (!input) return "";
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim();
}

export function validateEmail(email: string): { valid: boolean; error: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: "Email is required" };
  }
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: "Invalid email format" };
  }
  return { valid: true, error: "" };
}

export function validateRequired(value: string, fieldName: string): { valid: boolean; error: string } {
  if (!value || !value.trim()) {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true, error: "" };
}

export function validateZipCode(zipCode: string): { valid: boolean; error: string } {
  if (!zipCode) return { valid: true, error: "" };
  if (!zipCodeRegex.test(zipCode.trim())) {
    return { valid: false, error: "Invalid ZIP code format (12345 or 12345-6789)" };
  }
  return { valid: true, error: "" };
}

export function validatePhone(phone: string): { valid: boolean; error: string } {
  if (!phone) return { valid: true, error: "" };
  if (!phoneRegex.test(phone.trim())) {
    return { valid: false, error: "Invalid phone number format" };
  }
  return { valid: true, error: "" };
}

export function validateDate(dateString: string): { valid: boolean; error: string } {
  if (!dateString) return { valid: true, error: "" };
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }
  const now = new Date();
  if (date > now) {
    return { valid: false, error: "Date cannot be in the future" };
  }
  return { valid: true, error: "" };
}

export function validateVipCode(code: string): { valid: boolean; error: string } {
  if (!code || !code.trim()) {
    return { valid: false, error: "VIP code is required" };
  }
  if (code.trim().length < 10) {
    return { valid: false, error: "VIP code must be at least 10 characters" };
  }
  return { valid: true, error: "" };
}

export interface FormErrors {
  [key: string]: string;
}

export function clearFormError(errors: FormErrors, field: string): FormErrors {
  const newErrors = { ...errors };
  delete newErrors[field];
  return newErrors;
}
