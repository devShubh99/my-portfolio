/**
 * Input validators — email, password strength, and sanitization.
 */

/** Validate email format */
export function isValidEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
}

/** Password strength rules */
export interface PasswordCheck {
    valid: boolean;
    errors: string[];
}

export function checkPasswordStrength(password: string): PasswordCheck {
    const errors: string[] = [];

    if (password.length < 8) errors.push("Must be at least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("Must contain an uppercase letter");
    if (!/[0-9]/.test(password)) errors.push("Must contain a number");
    if (!/[^A-Za-z0-9]/.test(password))
        errors.push("Must contain a special character");

    return { valid: errors.length === 0, errors };
}

/** Sanitize string input (strip HTML tags / script injections) */
export function sanitize(input: string): string {
    return input
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
}

/** Sanitize and trim */
export function cleanInput(input: string): string {
    return sanitize(input.trim());
}
