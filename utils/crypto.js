// Generate an ECDH key pair (P-256). Named correctly as generateKeyPair.
export const generateKeyPair = () => {
  return window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
};
export const exportKey = (key) => {
  return window.crypto.subtle.exportKey("jwk", key).then(JSON.stringify);
};
export const importKey = (jwkString, isPrivateKey) => {
  return window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(jwkString),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    isPrivateKey ? ["deriveKey"] : []
  );
};
export const deriveSharedSecret = (privateKey, publicKey) => {
  return window.crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
};
export const encryptMessage = async (text, key) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Initialization Vector
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(text)
  );
  // Return as arrays for easy JSON serialization
  return {
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(ciphertext)),
  };
};
export const decryptMessage = async (encryptedData, key) => {
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(encryptedData.iv) },
      key,
      new Uint8Array(encryptedData.ciphertext)
    );
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decryption failed:", e);
    return "⚠️ Could not decrypt message.";
  }
};
