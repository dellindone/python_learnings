import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Pencil, Plus, Tags, Trash2 } from "lucide-react";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  updateProductPrice,
  updateProductStock,
} from "../../api/productApi";
import { getCategories } from "../../api/categoryApi";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Modal } from "../../components/ui/modal";
import { Textarea } from "../../components/ui/textarea";
import { formatCurrency, getErrorMessage } from "../../lib/utils";

function getEmptyForm(categories) {
  return {
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    sku: "",
    category_id: categories[0]?.id || "",
    is_active: true,
  };
}

function normalizeProductForm(form) {
  return {
    ...form,
    price: Number(form.price),
    stock_quantity: Number(form.stock_quantity),
  };
}

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [priceDrafts, setPriceDrafts] = useState({});
  const [stockDrafts, setStockDrafts] = useState({});

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const categories = categoriesQuery.data ?? [];

  const [form, setForm] = useState(getEmptyForm(categories));

  const categoriesById = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      map.set(category.id, category.name);
    });
    return map;
  }, [categories]);

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (editingProduct) {
        return updateProduct(editingProduct.id, payload);
      }
      return createProduct({
        name: payload.name,
        description: payload.description,
        price: payload.price,
        stock_quantity: payload.stock_quantity,
        sku: payload.sku,
        category_id: payload.category_id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(editingProduct ? "Product updated" : "Product created");
      closeModal();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not save product"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not delete product"));
    },
  });

  const stockMutation = useMutation({
    mutationFn: ({ productId, quantity }) => updateProductStock(productId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Stock updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not update stock"));
    },
  });

  const priceMutation = useMutation({
    mutationFn: ({ productId, price }) => updateProductPrice(productId, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Price updated");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not update price"));
    },
  });

  function openCreateModal() {
    setEditingProduct(null);
    setForm(getEmptyForm(categories));
    setIsModalOpen(true);
  }

  function openEditModal(product) {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price ?? ""),
      stock_quantity: String(product.stock_quantity ?? ""),
      sku: product.sku,
      category_id: product.category_id,
      is_active: Boolean(product.is_active),
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingProduct(null);
    setForm(getEmptyForm(categories));
  }

  function handleSubmit(event) {
    event.preventDefault();
    saveMutation.mutate(normalizeProductForm(form));
  }

  if (productsQuery.isLoading || categoriesQuery.isLoading) {
    return (
      <div className="page-shell rounded-[32px] bg-white p-10 shadow-md">
        <div className="space-y-4">
          <div className="h-10 w-72 animate-pulse rounded-full bg-slate-200" />
          <div className="h-96 animate-pulse rounded-[28px] bg-slate-100" />
        </div>
      </div>
    );
  }

  if (productsQuery.isError || categoriesQuery.isError) {
    return (
      <div className="page-shell rounded-[32px] bg-white p-10 text-center shadow-md">
        <h1 className="text-2xl font-bold text-slate-900">Could not load admin products</h1>
        <p className="mt-3 text-slate-500">
          {getErrorMessage(productsQuery.error || categoriesQuery.error)}
        </p>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-col gap-4 rounded-[32px] bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-primary">
            <Tags className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Admin catalog</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Manage products</h1>
          </div>
        </div>

        <Button size="lg" onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Create Product
        </Button>
      </div>

      <div className="overflow-hidden rounded-[32px] bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(productsQuery.data ?? []).map((product) => (
                <tr key={product.id} className="border-t border-slate-100 align-top">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-slate-900">{product.name}</p>
                    <p className="mt-1 max-w-xs text-sm text-slate-500">
                      {product.description || "No description provided."}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-sm font-medium text-slate-700">{product.sku}</td>
                  <td className="px-6 py-5 text-sm text-slate-600">
                    {categoriesById.get(product.category_id) || "Unknown"}
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(product.price)}</p>
                      <div className="flex min-w-[180px] items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={priceDrafts[product.id] ?? product.price}
                          onChange={(event) =>
                            setPriceDrafts((current) => ({
                              ...current,
                              [product.id]: event.target.value,
                            }))
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            priceMutation.mutate({
                              productId: product.id,
                              price: Number(priceDrafts[product.id] ?? product.price),
                            })
                          }
                          disabled={priceMutation.isPending}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-900">{product.stock_quantity}</p>
                      <div className="flex min-w-[170px] items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          value={stockDrafts[product.id] ?? product.stock_quantity}
                          onChange={(event) =>
                            setStockDrafts((current) => ({
                              ...current,
                              [product.id]: event.target.value,
                            }))
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            stockMutation.mutate({
                              productId: product.id,
                              quantity: Number(stockDrafts[product.id] ?? product.stock_quantity),
                            })
                          }
                          disabled={stockMutation.isPending}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        product.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(product)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Delete ${product.name}?`)) {
                            deleteMutation.mutate(product.id);
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={isModalOpen}
        title={editingProduct ? "Edit Product" : "Create Product"}
        description="Manage the product catalog with the same fields used by the backend API."
        onClose={closeModal}
      >
        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
            <Input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">SKU</span>
            <Input
              value={form.sku}
              onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Category</span>
            <select
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              value={form.category_id}
              onChange={(event) =>
                setForm((current) => ({ ...current, category_id: event.target.value }))
              }
              required
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Price</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Stock Quantity</span>
            <Input
              type="number"
              min="0"
              value={form.stock_quantity}
              onChange={(event) =>
                setForm((current) => ({ ...current, stock_quantity: event.target.value }))
              }
              required
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
            <Textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </label>

          <label className="flex items-center gap-3 md:col-span-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_active: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-slate-700">Product is active</span>
          </label>

          <div className="flex justify-end gap-3 md:col-span-2">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editingProduct ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
