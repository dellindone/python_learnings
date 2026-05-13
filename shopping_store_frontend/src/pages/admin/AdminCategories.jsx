import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { FolderTree, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../../api/categoryApi";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Modal } from "../../components/ui/modal";
import { Textarea } from "../../components/ui/textarea";
import { getErrorMessage } from "../../lib/utils";

function getEmptyForm() {
  return {
    name: "",
    description: "",
    is_active: true,
  };
}

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(getEmptyForm());

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => {
      if (editingCategory) {
        return updateCategory(editingCategory.id, payload);
      }
      return createCategory({
        name: payload.name,
        description: payload.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success(editingCategory ? "Category updated" : "Category created");
      closeModal();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not save category"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Category deleted");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not delete category"));
    },
  });

  function openCreateModal() {
    setEditingCategory(null);
    setForm(getEmptyForm());
    setIsModalOpen(true);
  }

  function openEditModal(category) {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description || "",
      is_active: Boolean(category.is_active),
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingCategory(null);
    setForm(getEmptyForm());
  }

  function handleSubmit(event) {
    event.preventDefault();
    saveMutation.mutate(form);
  }

  if (categoriesQuery.isLoading) {
    return (
      <div className="page-shell rounded-[32px] bg-white p-10 shadow-md">
        <div className="space-y-4">
          <div className="h-10 w-64 animate-pulse rounded-full bg-slate-200" />
          <div className="h-96 animate-pulse rounded-[28px] bg-slate-100" />
        </div>
      </div>
    );
  }

  if (categoriesQuery.isError) {
    return (
      <div className="page-shell rounded-[32px] bg-white p-10 text-center shadow-md">
        <h1 className="text-2xl font-bold text-slate-900">Could not load categories</h1>
        <p className="mt-3 text-slate-500">{getErrorMessage(categoriesQuery.error)}</p>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div className="flex flex-col gap-4 rounded-[32px] bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-primary">
            <FolderTree className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Admin taxonomy</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900">Manage categories</h1>
          </div>
        </div>

        <Button size="lg" onClick={openCreateModal}>
          <Plus className="mr-2 h-4 w-4" />
          Create Category
        </Button>
      </div>

      <div className="overflow-hidden rounded-[32px] bg-white shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-[0.2em] text-slate-400">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(categoriesQuery.data ?? []).map((category) => (
                <tr key={category.id} className="border-t border-slate-100">
                  <td className="px-6 py-5">
                    <p className="font-semibold text-slate-900">{category.name}</p>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-500">
                    {category.description || "No description provided."}
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        category.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditModal(category)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`Delete ${category.name}?`)) {
                            deleteMutation.mutate(category.id);
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
        title={editingCategory ? "Edit Category" : "Create Category"}
        description="Keep product organization clean with category-level controls."
        onClose={closeModal}
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Name</span>
            <Input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-700">Description</span>
            <Textarea
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_active: event.target.checked }))
              }
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <span className="text-sm font-medium text-slate-700">Category is active</span>
          </label>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
