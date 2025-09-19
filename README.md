# Buzztalk Frontend

This app uses client-side ECDH (P-256) to derive per-chat AES-GCM keys. Keys are managed as follows:

- Client generates a key pair during registration, stores the private key in `localStorage` under `privateKey_<username>`, and uploads only the public key to the backend.
- On login, if the local private key is missing, the app auto-generates a new key pair and rotates the backend public key so you can continue chatting. Old messages encrypted with the previous key may not be decryptable.

## Key Recovery Behavior

- Registration stores the private key locally: `localStorage.setItem("privateKey_<username>", <privateJwkString>)`.
- Login checks for the private key, and if absent:
  1.  Generates a new key pair
  2.  Sends the new public key to `POST /api/users/public-key`
  3.  Saves the new private key locally

This also happens on-demand in chat when selecting a friend if the key is missing.

## Development

- Vite + React with HMR.
- Global API base is configured via `VITE_API_URL`; defaults to `window.location.origin` when not set.
