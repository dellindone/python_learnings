import api from "./axios";

export async function getCurrentUser() {
  const response = await api.get("/user/me");
  return response.data.data;
}

export async function updateCurrentUser(payload) {
  const response = await api.patch("/user/me", payload);
  return response.data.data;
}
