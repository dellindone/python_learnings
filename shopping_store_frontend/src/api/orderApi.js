import api from "./axios";

export async function getOrders() {
  const response = await api.get("/orders/");
  return response.data.data;
}

export async function createOrder() {
  const response = await api.post("/orders/");
  return response.data.data;
}

export async function cancelOrder(orderId) {
  const response = await api.post(`/orders/${orderId}/cancel`);
  return response.data.data;
}
