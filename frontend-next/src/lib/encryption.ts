import { ethers } from 'ethers';

/**
 * Basic XOR Encryption for demonstration (Simulating AES-GCM)
 */
export const xorEncrypt = (text: string, key: string): string => {
    const textBytes = ethers.toUtf8Bytes(text);
    const keyBytes = ethers.toUtf8Bytes(key);
    const result = new Uint8Array(textBytes.length);

    for (let i = 0; i < textBytes.length; i++) {
        result[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return ethers.encodeBase64(result);
};

export const xorDecrypt = (base64: string, key: string): string => {
    const encryptedBytes = ethers.decodeBase64(base64);
    const keyBytes = ethers.toUtf8Bytes(key);
    const result = new Uint8Array(encryptedBytes.length);

    for (let i = 0; i < encryptedBytes.length; i++) {
        result[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return ethers.toUtf8String(result);
};

/**
 * Deterministic Key Derivation from Signature
 */
export const deriveKeyFromSignature = (sig: string): string => {
    return ethers.keccak256(ethers.toUtf8Bytes(sig));
};

/**
 * SHA-256 Checksum Generation
 */
export const generateChecksum = (data: string): string => {
    return ethers.sha256(ethers.toUtf8Bytes(data));
};
