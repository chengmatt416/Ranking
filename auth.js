// Shared authentication module for the Ranking system
// Uses encrypted password verification for enhanced security

// Encrypted admin credentials - DO NOT store plain text password
const ADMIN_RANDOM_TOKEN = 'R4nK1nG_S3cUr3_T0k3N_2024_X7Y9Z';
const ADMIN_ENCRYPTED_TOKEN = 'QcFU8y3lr/OnEVLrChILHzssxwNHgCXAkN6BjpbObWZhpioM5rmANujbMqBwbxjEOlDJp+yKiPh5fwzrplvKu98EYuxULSGPTN+o';

/**
 * Decrypt encrypted token with provided password using Web Crypto API
 * @param {string} encryptedBase64 - Base64 encoded encrypted data
 * @param {string} password - Password to decrypt with
 * @returns {Promise<string|null>} Decrypted string or null if failed
 */
async function decryptToken(encryptedBase64, password) {
    try {
        const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        
        const salt = encrypted.slice(0, 16);
        const iv = encrypted.slice(16, 28);
        const authTag = encrypted.slice(28, 44);
        const data = encrypted.slice(44);
        
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );
        
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );
        
        // Combine data and auth tag for AES-GCM
        const ciphertext = new Uint8Array(data.length + authTag.length);
        ciphertext.set(data, 0);
        ciphertext.set(authTag, data.length);
        
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv, tagLength: 128 },
            key,
            ciphertext
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    } catch (error) {
        return null;
    }
}

/**
 * Verify admin password by attempting to decrypt the stored token
 * @param {string} password - Password to verify
 * @returns {Promise<boolean>} True if password is correct
 */
async function verifyAdminPassword(password) {
    const decrypted = await decryptToken(ADMIN_ENCRYPTED_TOKEN, password);
    return decrypted === ADMIN_RANDOM_TOKEN;
}

/**
 * Get the encrypted admin credentials for display purposes
 * @returns {Object} Object containing token info
 */
function getAdminCredentials() {
    return {
        randomToken: ADMIN_RANDOM_TOKEN,
        encryptedToken: ADMIN_ENCRYPTED_TOKEN
    };
}
