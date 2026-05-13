import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error?.response?.status !== 401 ||
      originalRequest?._retry ||
      !useAuthStore.getState().refreshToken
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        const refreshToken = useAuthStore.getState().refreshToken;
        refreshPromise = refreshClient
          .post("/auth/refresh_token", { refresh_token: refreshToken })
          .then((response) => response.data.data)
          .finally(() => {
            refreshPromise = null;
          });
      }

      const tokenData = await refreshPromise;
      useAuthStore.getState().setTokens({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
      });

      originalRequest.headers.Authorization = `Bearer ${tokenData.access_token}`;
      return api(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearAuth();
      window.location.assign("/login");
      return Promise.reject(refreshError);
    }
  },
);

export default api;
