import api from "./axios";

export async function getProducts() {
  const response = await api.get("/products/");
  return response.data.data;
}

export async function getProduct(productId) {
  const response = await api.get(`/products/${productId}`);
  return response.data.data;
}

export async function searchProducts(productName) {
  const response = await api.get("/products/search", {
    params: { product_name: productName },
  });
  return response.data.data;
}

export async function getProductsByCategory(categoryId) {
  const response = await api.get(`/products/category/${categoryId}`);
  return response.data.data;
}

export async function createProduct(payload) {
  const response = await api.post("/products/", payload);
  return response.data.data;
}

export async function updateProduct(productId, payload) {
  const response = await api.patch(`/products/${productId}`, payload);
  return response.data.data;
}

export async function updateProductStock(productId, quantity) {
  const response = await api.patch(`/products/${productId}/stock`, null, {
    params: { new_quantity: quantity },
  });
  return response.data.data;
}

export async function updateProductPrice(productId, price) {
  const response = await api.patch(`/products/${productId}/price`, null, {
    params: { new_price: price },
  });
  return response.data.data;
}

export async function deleteProduct(productId) {
  const response = await api.delete(`/products/${productId}`);
  return response.data.data;
}
