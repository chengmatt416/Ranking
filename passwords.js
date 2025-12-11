// Secure password storage module for the Ranking system
// Passwords are stored in CSV as high-entropy random values for cross-device sync

// Generate random high-entropy hex strings for passwords (64 characters)
function generateSecurePassword(length = 64) {
    const array = new Uint8Array(length / 2);
    crypto.getRandomValues(array);
    const hashArray = Array.from(array);
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
 * Load passwords from localStorage (for backward compatibility)
 * This is a migration helper - passwords should ultimately come from CSV
 */
function loadStoredPasswords() {
    const commentPwd = localStorage.getItem('comment_password_value');
    const queryPwd = localStorage.getItem('query_password_value');
    
    return {
        commentPassword: commentPwd,
        queryPassword: queryPwd
    };
}
