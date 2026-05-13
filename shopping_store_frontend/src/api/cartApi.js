import api from "./axios";

export async function getCart() {
  const response = await api.get("/cart/");
  return response.data.data;
}

export async function addToCart(payload) {
  const response = await api.post("/cart/", payload);
  return response.data.data;
}

export async function updateCartItem(productId, payload) {
  const response = await api.patch(`/cart/${productId}`, payload);
  return response.data.data;
}

export async function removeCartItem(productId) {
  const response = await api.delete(`/cart/${productId}`);
  return response.data.data;
}
