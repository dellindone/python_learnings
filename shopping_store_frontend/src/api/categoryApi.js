import api from "./axios";

export async function getCategories() {
  const response = await api.get("/categories/");
  return response.data.data;
}

export async function getCategory(categoryId) {
  const response = await api.get(`/categories/${categoryId}`);
  return response.data.data;
}

export async function searchCategories(categoryName) {
  const response = await api.get("/categories/search/", {
    params: { category_name: categoryName },
  });
  return response.data.data;
}

export async function createCategory(payload) {
  const response = await api.post("/categories/", payload);
  return response.data.data;
}

export async function updateCategory(categoryId, payload) {
  const response = await api.patch(`/categories/${categoryId}`, payload);
  return response.data.data;
}

export async function deleteCategory(categoryId) {
  const response = await api.delete(`/categories/${categoryId}`);
  return response.data.data;
}
