/**
 * Validation Utilities
 * Input validation and sanitization
 */

class ValidationUtils {
    /**
     * Normalize username: trim and lowercase
     */
    static normalizeUsername(value) {
        return value.trim().toLowerCase();
    }

    /**
     * Validate email format
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate password strength
     */
    static validatePassword(password) {
        const issues = [];

        if (password.length < 8) {
            issues.push('Password must be at least 8 characters');
        }
        if (!/[A-Z]/.test(password)) {
            issues.push('Password must include uppercase letters');
        }
        if (!/[a-z]/.test(password)) {
            issues.push('Password must include lowercase letters');
        }
        if (!/[0-9]/.test(password)) {
            issues.push('Password must include numbers');
        }
        if (!/[!@#$%^&*]/.test(password)) {
            issues.push('Password must include special characters (!@#$%^&*)');
        }

        return {
            isValid: issues.length === 0,
            issues,
        };
    }

    /**
     * Validate required fields
     */
    static validateRequired(data, requiredFields) {
        const errors = {};

        requiredFields.forEach((field) => {
            if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
                errors[field] = `${field} is required`;
            }
        });

        return {
            isValid: Object.keys(errors).length === 0,
            errors,
        };
    }

    /**
     * Sanitize HTML to prevent XSS
     */
    static sanitizeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
}

module.exports = ValidationUtils;
