import api from "./axios";

export async function registerUser(payload) {
  const response = await api.post("/auth/register", payload);
  return response.data.data;
}

export async function loginUser(payload) {
  const response = await api.post("/auth/login", payload);
  return response.data.data;
}

export async function logoutUser(refreshToken) {
  const response = await api.post("/auth/logout", {
    refresh_token: refreshToken,
  });
  return response.data.data;
}

export async function refreshTokenRequest(refreshToken) {
  const response = await api.post("/auth/refresh_token", {
    refresh_token: refreshToken,
  });
  return response.data.data;
}
