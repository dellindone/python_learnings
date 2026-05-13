import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Search, Sparkles, Tags } from "lucide-react";
import { getProducts } from "../api/productApi";
import { getCategories } from "../api/categoryApi";
import { addToCart } from "../api/cartApi";
import ProductCard from "../components/ProductCard";
import SkeletonCard from "../components/SkeletonCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { getErrorMessage } from "../lib/utils";

export default function Home() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }) =>
      addToCart({
        product_id: productId,
        quantity,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Added to cart");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not add item to cart"));
    },
  });

  const filteredProducts = useMemo(() => {
    const items = productsQuery.data ?? [];
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return items.filter((product) => {
      const matchesCategory =
        activeCategory === "all" || product.category_id === activeCategory;
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.description?.toLowerCase().includes(normalizedSearch) ||
        product.sku.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, productsQuery.data, searchTerm]);

  const categories = categoriesQuery.data ?? [];

  return (
    <div className="page-shell space-y-8">
      <section className="overflow-hidden rounded-[36px] bg-hero p-8 shadow-soft sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary shadow-sm">
              <Sparkles className="h-4 w-4" />
              Premium catalog
            </div>
            <h1 className="mt-6 max-w-2xl text-4xl font-extrabold leading-tight text-slate-950 sm:text-5xl">
              Discover polished storefront flows built on your FastAPI shopping backend.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
              Search products, filter by category, and move from browse to checkout with a clean,
              responsive shopping experience.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Products", value: productsQuery.data?.length ?? 0 },
              { label: "Categories", value: categories.length },
              { label: "Ready to order", value: filteredProducts.length },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[28px] bg-white/80 p-5 shadow-md backdrop-blur">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-900">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-[30px] bg-white p-5 shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search products by name, description, or SKU"
            className="pl-11"
          />
        </div>
        <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
          <Tags className="h-4 w-4 text-primary" />
          {filteredProducts.length} matching products
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Browse by category</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Explore the collection</h2>
          </div>
        </div>

        <div className="scrollbar-none flex gap-3 overflow-x-auto pb-1">
          <Button
            variant={activeCategory === "all" ? "default" : "outline"}
            onClick={() => setActiveCategory("all")}
          >
            All Products
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </section>

      {productsQuery.isLoading ? (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </section>
      ) : productsQuery.isError ? (
        <section className="rounded-[30px] bg-white p-10 text-center shadow-md">
          <h3 className="text-2xl font-bold text-slate-900">Could not load products</h3>
          <p className="mt-3 text-slate-500">
            {getErrorMessage(productsQuery.error, "Please make sure the backend is running on port 8000.")}
          </p>
        </section>
      ) : filteredProducts.length === 0 ? (
        <section className="rounded-[30px] bg-white p-10 text-center shadow-md">
          <h3 className="text-2xl font-bold text-slate-900">No matching products</h3>
          <p className="mt-3 text-slate-500">
            Try a different search term or switch back to another category tab.
          </p>
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={() =>
                addToCartMutation.mutate({
                  productId: product.id,
                  quantity: 1,
                })
              }
              isPending={addToCartMutation.isPending && addToCartMutation.variables?.productId === product.id}
            />
          ))}
        </section>
      )}
    </div>
  );
}
