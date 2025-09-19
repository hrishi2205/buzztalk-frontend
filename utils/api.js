const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const apiRequest = async (
  endpoint,
  method = "GET",
  body = null,
  token = null
) => {
  const options = {
    method,
    headers: {},
  };
  if (token) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${API_URL}/api/${endpoint}`, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "API request failed");
  }
  return data;
};
