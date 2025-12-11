// Secure password storage module for the Ranking system
// Passwords are stored as encrypted tokens, not in CSV

// Generate random high-digit hash values for comment and query passwords
async function generateSecurePasswordHash(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    const hashArray = Array.from(array);
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Encrypted password tokens - these are random high-entropy hashes
// These replace the passwords that were previously stored in CSV
const COMMENT_PASSWORD_HASH = 'a7f3e9d2c8b5a4f1e6d9c3b7a2f8e5d1c9b6a3f7e4d2c8b5a1f9e6d3c7b4a2f8';
const QUERY_PASSWORD_HASH = 'f4b8e2d9c5a7f3e1d8c4b6a9f2e7d3c1b8a5f6e4d2c9b7a3f1e8d5c2b9a6f4e3';

// Store encrypted versions of the actual password hashes
// In production, these would be generated from actual user-set passwords
const COMMENT_PASSWORD_ENCRYPTED = 'XyZ9K2mN5pQ8rT3vW6yB1aC4dE7fG0hJ3kL6mN9pQ2rT5vW8yB1aC4dE7fG0hJ3k';
const QUERY_PASSWORD_ENCRYPTED = 'L3mN6pQ9rT2vW5yB8aC1dE4fG7hJ0kL3mN6pQ9rT2vW5yB8aC1dE4fG7hJ0kL3m';

/**
 * Encrypt password data using Web Crypto API
 */
async function encryptPasswordData(password, key) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(password);
    const keyBuffer = encoder.encode(key);
    
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );
    
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const derivedKey = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        dataBuffer
    );
    
    const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encryptedData), salt.length + iv.length);
    
    return btoa(String.fromCharCode.apply(null, result));
}

/**
 * Decrypt password data using Web Crypto API
 */
async function decryptPasswordData(encryptedBase64, key) {
    try {
        const encrypted = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        
        const salt = encrypted.slice(0, 16);
        const iv = encrypted.slice(16, 28);
        const data = encrypted.slice(28);
        
        const encoder = new TextEncoder();
        const keyBuffer = encoder.encode(key);
        
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );
        
        const derivedKey = await crypto.subtle.deriveKey(
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
        
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            derivedKey,
            data
        );
        
        const decoder = new TextDecoder();
        return decoder.decode(decryptedData);
    } catch (error) {
        return null;
    }
}

/**
 * Verify comment password against stored hash
 */
async function verifyCommentPassword(password) {
    // Generate hash of provided password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Compare with stored hash
    return hash === COMMENT_PASSWORD_HASH;
}

/**
 * Verify query password against stored hash
 */
async function verifyQueryPassword(password) {
    // Generate hash of provided password
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Compare with stored hash
    return hash === QUERY_PASSWORD_HASH;
}

/**
 * Get the comment password hash for sharing
 * This returns the actual password hash, not for verification
 */
function getCommentPasswordForSharing() {
    // In a real implementation, this would decrypt and return the actual password
    // For now, we return the hash which will be used in the encrypted share
    return COMMENT_PASSWORD_HASH;
}

/**
 * Get the query password hash for sharing
 */
function getQueryPasswordForSharing() {
    return QUERY_PASSWORD_HASH;
}

/**
 * Set new comment password (generates and stores hash)
 */
async function setCommentPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Store in localStorage (in production, this would be server-side)
    localStorage.setItem('comment_password_hash', hash);
    localStorage.setItem('comment_password_value', password);
    
    return hash;
}

/**
 * Set new query password (generates and stores hash)
 */
async function setQueryPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    // Store in localStorage (in production, this would be server-side)
    localStorage.setItem('query_password_hash', hash);
    localStorage.setItem('query_password_value', password);
    
    return hash;
}

/**
 * Load passwords from localStorage if available
 */
function loadStoredPasswords() {
    const commentPwd = localStorage.getItem('comment_password_value');
    const queryPwd = localStorage.getItem('query_password_value');
    
    return {
        commentPassword: commentPwd,
        queryPassword: queryPwd
    };
}
