/**
 * Centralized Logging Utility
 * For production, this should integrate with a dedicated error tracking service (e.g., Sentry, LogRocket).
 */

class Logger {
    /**
     * Logs an error message. In production, this would send to a monitoring service.
     * @param {string} message - The error message.
     * @param {Error} error - The error object.
     * @param {object} context - Additional context for the error.
     */
    static error(message, error, context = {}) {
        console.error(`[ERROR] ${message}`, error, context);
        // TODO: In production, integrate with a service like Sentry:
        // Sentry.captureException(error, {
        //     level: 'error',
        //     message: message,
        //     extra: context,
        // });
    }

    /**
     * Logs a warning message.
     */
    static warn(message, context = {}) {
        console.warn(`[WARN] ${message}`, context);
    }

    /**
     * Logs an info message.
     */
    static info(message, context = {}) {
        console.info(`[INFO] ${message}`, context);
    }

    /**
     * Logs a debug message (usually disabled in production).
     */
    static debug(message, context = {}) {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[DEBUG] ${message}`, context);
        }
    }
}

module.exports = Logger;