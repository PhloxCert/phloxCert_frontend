/**
 * IOTA Safety Net - Core Security Module
 * Handles document verification simulation and hashing.
 */

export const generateHash = (fileName) => {
    // Simulate SHA-256 hash generation
    const timestamp = Date.now().toString(16);
    const randomPart = Math.random().toString(16).substr(2, 8);
    return `0x${timestamp}7f82b${randomPart}fca2`;
};

export const verifyDocument = (file) => {
    return new Promise((resolve) => {
        console.log(`Verifying ${file.name}...`);
        setTimeout(() => {
            resolve({
                verified: true,
                hash: generateHash(file.name),
                timestamp: new Date().toISOString(),
                status: "TRUSTED"
            });
        }, 2000); // 2 second simulation
    });
};
