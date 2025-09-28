// Detect hosting environment early so both REST + Socket share logic
const hostEarly = typeof window !== "undefined" ? window.location.hostname : "";
const isNetlifyHostEarly = /\.netlify\.app$/i.test(hostEarly);
const isBuzztalkCustomHostEarly = /(^|\.)buzztalk\.me$/i.test(hostEarly);

// Normalize API base URL for all API/socket calls
// Priority:
// 1. Explicit VITE_API_URL
// 2. Known production host (buzztalk.me / *.netlify.app) -> dedicated backend https://server.buzztalk.me
// 3. window.location.origin (useful when backend is reverse-proxied under same domain)
// 4. Local dev default
export const API_URL = (
  import.meta.env.VITE_API_URL ||
  (isNetlifyHostEarly || isBuzztalkCustomHostEarly
    ? "https://server.buzztalk.me"
    : typeof window !== "undefined"
    ? window.location.origin
    : "") ||
  "http://localhost:5000"
).replace(/\/$/, "");

export const apiRequest = async (
  endpoint,
  method = "GET",
  body = null,
  token = null
) => {
  const url = `${API_URL}/api/${endpoint}`;

  const headers = {
    Accept: "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  // If a body is provided, send JSON
  const hasBody = body !== null && body !== undefined;
  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  const options = {
    method,
    headers,
    ...(hasBody ? { body: JSON.stringify(body) } : {}),
  };

  let response;
  try {
    response = await fetch(url, options);
  } catch (e) {
    // Network errors (CORS, DNS, connection refused, etc.)
    throw new Error(`Network error contacting API: ${e.message}`);
  }

  let data;
  const contentType = response.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }
  } catch (e) {
    data = { message: "Invalid response from server" };
  }

  if (!response.ok) {
    // Special-case 401 to aid debugging + allow caller to trigger logout
    if (response.status === 401) {
      const msg = data?.message || "Unauthorized (401)";
      const error = new Error(msg);
      error.status = 401;
      // Helpful one-time console hint (non-fatal)
      if (typeof window !== "undefined" && !window.__BUZZTALK__401_HINT_SHOWN) {
        // eslint-disable-next-line no-console
        console.warn(
          "[Buzztalk] Received 401 from API:",
          url,
          "— verify token validity, API_URL env (VITE_API_URL)",
          "and CORS/Authorization handling on backend."
        );
        window.__BUZZTALK__401_HINT_SHOWN = true;
      }
      throw error;
    }
    const msg = data?.message || `API request failed (${response.status})`;
    const error = new Error(msg);
    error.status = response.status;
    throw error;
  }
  return data;
};

// Detect hosting environment (reuse early detection to avoid divergence)
const host = hostEarly;
const isNetlifyHost = isNetlifyHostEarly;
const isBuzztalkCustomHost = isBuzztalkCustomHostEarly;

// Socket base URL priority:
// 1) VITE_SOCKET_URL if provided
// 2) If on Netlify subdomain, use the dedicated backend origin to bypass proxy
// 3) Fallback to API_URL (same-origin/proxy)
export const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL ||
  (isNetlifyHost || isBuzztalkCustomHost
    ? "https://server.buzztalk.me"
    : API_URL)
).replace(/\/$/, "");

// Expose minimal runtime config for debugging in console
if (typeof window !== "undefined") {
  // Avoid overwriting if already set
  window.__BUZZTALK_CONFIG = window.__BUZZTALK_CONFIG || {
    API_URL,
    SOCKET_URL,
  };
}

// Upload an avatar file using multipart/form-data. Returns { url }
export const uploadAvatarFile = async (file, token) => {
  const url = `${API_URL}/api/upload/avatar`;
  const form = new FormData();
  form.append("avatar", file);
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, { method: "POST", body: form, headers });
  } catch (e) {
    throw new Error(`Network error uploading avatar: ${e.message}`);
  }

  let data;
  const contentType = response.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }
  } catch (e) {
    data = { message: "Invalid response from server" };
  }

  if (!response.ok) {
    const msg = data?.message || `Avatar upload failed (${response.status})`;
    throw new Error(msg);
  }
  return data; // { url }
};

// Upload any chat file using multipart/form-data. Returns { url, filename, mimetype, size }
export const uploadChatFile = async (file, token) => {
  const url = `${API_URL}/api/upload/file`;
  const form = new FormData();
  form.append("file", file);
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, { method: "POST", body: form, headers });
  } catch (e) {
    throw new Error(`Network error uploading file: ${e.message}`);
  }

  let data;
  const contentType = response.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }
  } catch (e) {
    data = { message: "Invalid response from server" };
  }

  if (!response.ok) {
    const msg = data?.message || `File upload failed (${response.status})`;
    throw new Error(msg);
  }
  return data; // { url, filename, mimetype, size }
};

// Delete a chat
export const deleteChat = async (chatId, token) => {
  return apiRequest(`chats/${chatId}`, "DELETE", null, token);
};

// Unfriend a user (both sides)
export const unfriendUser = async (userId, token) => {
  return apiRequest("users/unfriend", "POST", { userId }, token);
};

// Block a user (adds to current user's blocked list and removes friendship)
export const blockUser = async (userId, token) => {
  return apiRequest("users/block", "POST", { userId }, token);
};

// Unblock a user
export const unblockUser = async (userId, token) => {
  return apiRequest("users/unblock", "POST", { userId }, token);
};
