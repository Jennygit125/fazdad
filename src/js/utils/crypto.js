/**
 * Cryptographic Utilities
 * Secure password hashing and crypto operations
 */

const HASH_ITERATIONS = 210000;

class CryptoUtils {
    constructor() {
        this.encoder = new TextEncoder();
        this.decoder = new TextDecoder();
    }

    /**
     * Check if Web Crypto API is available
     */
    static isAvailable() {
        return Boolean(window.crypto && window.crypto.subtle);
    }

    /**
     * Generate random bytes
     */
    randomBytes(length) {
        const bytes = new Uint8Array(length);
        window.crypto.getRandomValues(bytes);
        return bytes;
    }

    /**
     * Convert bytes to Base64
     */
    toBase64(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.length; i += 1) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert Base64 to bytes
     */
    fromBase64(value) {
        const binary = atob(value);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Timing-safe comparison of two byte arrays
     */
    timingSafeEqual(left, right) {
        if (!left || !right || left.length !== right.length) return false;
        let difference = 0;
        for (let i = 0; i < left.length; i += 1) {
            difference |= left[i] ^ right[i];
        }
        return difference === 0;
    }

    /**
     * Hash password using PBKDF2
     */
    async hashPassword(password, salt, iterations = HASH_ITERATIONS) {
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            this.encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits'],
        );
        
        const bits = await window.crypto.subtle.deriveBits(
            { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
            keyMaterial,
            256,
        );
        
        return new Uint8Array(bits);
    }

    /**
     * Generate a random salt
     */
    generateSalt(length = 16) {
        return this.randomBytes(length);
    }
}

module.exports = new CryptoUtils();
