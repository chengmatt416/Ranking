#!/usr/bin/env python3
"""
Script to encrypt ratings data from data.csv
Separates ratings (encrypted) from comments (plain text)
"""

def xor_encrypt(text, key):
    """Simple XOR encryption with key"""
    encrypted = []
    for i, char in enumerate(text):
        key_char = key[i % len(key)]
        encrypted_char = chr(ord(char) ^ ord(key_char))
        encrypted.append(encrypted_char)
    return ''.join(encrypted)

def base64_encode(text):
    """Base64 encode"""
    import base64
    return base64.b64encode(text.encode('utf-8')).decode('utf-8')

def encrypt_data(text, key):
    """Encrypt and encode data"""
    encrypted = xor_encrypt(text, key)
    return base64_encode(encrypted)

def main():
    ENCRYPTION_KEY = 'RANKING_SYSTEM_2024_SECRET_KEY_DO_NOT_SHARE'
    
    # Read data.csv
    with open('data.csv', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Extract ratings data (all lines except 銳評 and 密碼)
    ratings_lines = []
    comment_line_index = -1
    password_line_index = -1
    view_password = ''
    query_password = ''
    
    for i, line in enumerate(lines):
        if line.startswith('銳評'):
            comment_line_index = i
        elif line.startswith('密碼'):
            password_line_index = i
            # Extract passwords
            parts = line.strip().split(',')
            if len(parts) > 1:
                view_password = parts[1]
            if len(parts) > 2:
                query_password = parts[2]
        else:
            if i == 0 or (comment_line_index == -1 or i < comment_line_index):
                ratings_lines.append(line)
    
    # Create ratings CSV content
    ratings_content = ''.join(ratings_lines).strip()
    
    # Encrypt ratings
    encrypted_ratings = encrypt_data(ratings_content, ENCRYPTION_KEY)
    
    # Write encrypted ratings
    with open('data.enc.txt', 'w', encoding='utf-8') as f:
        f.write(encrypted_ratings)
    
    print("Created data.enc.txt (encrypted ratings)")
    
    # Extract and write comments (already created comments.csv separately)
    # Just write passwords file
    with open('passwords.txt', 'w', encoding='utf-8') as f:
        f.write(f'VIEW_PASSWORD={view_password}\n')
        f.write(f'QUERY_PASSWORD={query_password}\n')
    
    print("Created passwords.txt")
    print("\nEncryption completed successfully!")
    print("Files created:")
    print("  - data.enc.txt (encrypted ratings - commit to repo)")
    print("  - passwords.txt (passwords - commit to repo)")
    print("  - comments.csv (plain comments - already exists)")

if __name__ == '__main__':
    main()
