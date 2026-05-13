import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Minus, Plus, ReceiptIndianRupee, Shapes } from "lucide-react";
import { getProduct } from "../api/productApi";
import { getCategories } from "../api/categoryApi";
import { addToCart } from "../api/cartApi";
import { Button } from "../components/ui/button";
import { formatCurrency, getErrorMessage } from "../lib/utils";

export default function ProductDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);

  const productQuery = useQuery({
    queryKey: ["products", id],
    queryFn: () => getProduct(id),
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const addToCartMutation = useMutation({
    mutationFn: (payload) => addToCart(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not add this product"));
    },
  });

  if (productQuery.isLoading) {
    return (
      <div className="page-shell rounded-[32px] bg-white p-10 shadow-md">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="h-96 animate-pulse rounded-[32px] bg-slate-200" />
          <div className="space-y-4">
            <div className="h-12 w-2/3 animate-pulse rounded-full bg-slate-200" />
            <div className="h-6 w-40 animate-pulse rounded-full bg-slate-100" />
            <div className="h-24 w-full animate-pulse rounded-[28px] bg-slate-100" />
          </div>
        </div>
      </div>
    );
  }

  if (productQuery.isError) {
    return (
      <div className="page-shell rounded-[32px] bg-white p-10 text-center shadow-md">
        <h2 className="text-2xl font-bold text-slate-900">Product unavailable</h2>
        <p className="mt-3 text-slate-500">{getErrorMessage(productQuery.error)}</p>
      </div>
    );
  }

  const product = productQuery.data;
  const category = (categoriesQuery.data ?? []).find((item) => item.id === product.category_id);
  const isOutOfStock = Number(product.stock_quantity) <= 0;

  return (
    <div className="page-shell rounded-[36px] bg-white p-6 shadow-soft sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="gradient-product relative min-h-[380px] overflow-hidden rounded-[32px] p-8 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.25),transparent_30%)]" />
          <div className="relative flex h-full flex-col justify-between">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em]">
              <Shapes className="h-4 w-4" />
              Product spotlight
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-100">SKU · {product.sku}</p>
              <h1 className="mt-4 max-w-xl text-4xl font-extrabold leading-tight">{product.name}</h1>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] bg-slate-50 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Price</p>
            <div className="mt-3 flex items-center gap-3">
              <ReceiptIndianRupee className="h-7 w-7 text-primary" />
              <span className="text-4xl font-extrabold text-slate-900">
                {formatCurrency(product.price)}
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-slate-200 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Stock</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{product.stock_quantity}</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Category</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{category?.name || "Unknown"}</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-900">Description</h2>
            <p className="mt-3 text-slate-600">
              {product.description || "No description has been added for this product yet."}
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-[28px] bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Choose quantity</p>
              <div className="mt-3 flex items-center rounded-full border border-slate-200 bg-white p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="min-w-12 text-center text-base font-semibold text-slate-900">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setQuantity((current) => current + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Button
              size="lg"
              onClick={() =>
                addToCartMutation.mutate({
                  product_id: product.id,
                  quantity,
                })
              }
              disabled={isOutOfStock || addToCartMutation.isPending}
            >
              {isOutOfStock ? "Out of Stock" : addToCartMutation.isPending ? "Adding..." : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
