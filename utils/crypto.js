// Generate an ECDH key pair (P-256). Named correctly as generateKeyPair.
export const generateKeyPair = () => {
  return window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
};
export const exportKey = (key) => {
  // Returns a JSON stringified JWK for storage/transport convenience
  return window.crypto.subtle.exportKey("jwk", key).then(JSON.stringify);
};
export const importKey = (jwkOrString, isPrivateKey) => {
  if (!jwkOrString) {
    throw new Error("Missing key material for import");
  }
  const jwkRaw =
    typeof jwkOrString === "string" ? JSON.parse(jwkOrString) : jwkOrString;
  const jwk = { ...jwkRaw };
  // Normalize minimal ECDH P-256 JWKs that might miss required members from some backends
  if (!jwk.kty) jwk.kty = "EC";
  if (!jwk.crv) jwk.crv = "P-256";
  if (isPrivateKey && !jwk.d) {
    throw new Error("Invalid private key: missing 'd' parameter");
  }
  return window.crypto.subtle.importKey(
    "jwk",
    jwk,
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

// --- Helpers for JWK normalization ---
const toBase64Url = (b64) =>
  b64.replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
const bytesToBase64Url = (bytes) => {
  let binary = "";
  const arr = Array.isArray(bytes)
    ? Uint8Array.from(bytes)
    : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) binary += String.fromCharCode(arr[i]);
  const b64 =
    typeof btoa === "function"
      ? btoa(binary)
      : Buffer.from(binary, "binary").toString("base64");
  return toBase64Url(b64);
};

export const normalizeEcPublicJwk = (input) => {
  // Accept string, object, or wrapped shapes { publicKey: {...} }
  let jwk = typeof input === "string" ? JSON.parse(input) : { ...input };
  if (
    jwk &&
    typeof jwk === "object" &&
    jwk.publicKey &&
    typeof jwk.publicKey === "object"
  ) {
    jwk = { ...jwk.publicKey };
  }
  // Some APIs might return under different keys
  if (jwk.key && typeof jwk.key === "object") jwk = { ...jwk.key };

  // Map alternate property names
  if (jwk.X && !jwk.x) jwk.x = jwk.X;
  if (jwk.Y && !jwk.y) jwk.y = jwk.Y;
  if (jwk.xCoord && !jwk.x) jwk.x = jwk.xCoord;
  if (jwk.yCoord && !jwk.y) jwk.y = jwk.yCoord;

  // If x/y are bytes/arrays, convert to base64url
  if (Array.isArray(jwk.x) || jwk.x instanceof Uint8Array)
    jwk.x = bytesToBase64Url(jwk.x);
  if (Array.isArray(jwk.y) || jwk.y instanceof Uint8Array)
    jwk.y = bytesToBase64Url(jwk.y);

  // Convert base64 to base64url if necessary
  if (typeof jwk.x === "string" && /[+/=]/.test(jwk.x))
    jwk.x = toBase64Url(jwk.x);
  if (typeof jwk.y === "string" && /[+/=]/.test(jwk.y))
    jwk.y = toBase64Url(jwk.y);

  // Ensure required members
  if (!jwk.kty) jwk.kty = "EC";
  if (!jwk.crv) jwk.crv = "P-256";

  // Return minimal object
  return { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y };
};

// --- Password-based encryption for private key at rest on server ---
const enc = new TextEncoder();
const dec = new TextDecoder();

const toB64 = (buf) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return typeof btoa === "function"
    ? btoa(binary)
    : Buffer.from(binary, "binary").toString("base64");
};

const fromB64 = (b64) => {
  const binary =
    typeof atob === "function"
      ? atob(b64)
      : Buffer.from(b64, "base64").toString("binary");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const getPBKDF2Key = async (password, salt, iterations = 150000) => {
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const encryptPrivateKeyWithPassword = async (
  privateJwkString,
  password,
  opts = {}
) => {
  const salt = opts.salt || window.crypto.getRandomValues(new Uint8Array(16));
  const iv = opts.iv || window.crypto.getRandomValues(new Uint8Array(12));
  const iterations = opts.iterations || 150000;
  const key = await getPBKDF2Key(password, salt, iterations);
  const data = enc.encode(privateJwkString);
  const ct = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  return {
    ciphertext: toB64(ct),
    iv: toB64(iv),
    salt: toB64(salt),
    iterations,
    algo: "pbkdf2-aesgcm-v1",
  };
};

export const decryptPrivateKeyWithPassword = async (bundle, password) => {
  if (!bundle || !bundle.ciphertext || !bundle.iv || !bundle.salt) {
    throw new Error("Invalid encrypted private key bundle");
  }
  const iterations = bundle.iterations || 150000;
  const salt = fromB64(bundle.salt);
  const iv = fromB64(bundle.iv);
  const key = await getPBKDF2Key(password, salt, iterations);
  const ct = fromB64(bundle.ciphertext);
  const pt = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ct
  );
  return dec.decode(pt);
};
