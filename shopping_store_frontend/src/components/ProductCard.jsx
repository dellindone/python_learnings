import { Link } from "react-router-dom";
import { PackageOpen } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { Button } from "./ui/button";

function StockBadge({ stockQuantity }) {
  if (stockQuantity <= 0) {
    return <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-danger">Out of Stock</span>;
  }

  if (stockQuantity < 5) {
    return <span className="rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">Low Stock</span>;
  }

  return <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-success">In Stock</span>;
}

export default function ProductCard({ product, onAddToCart, isPending }) {
  const isOutOfStock = Number(product.stock_quantity) <= 0;

  return (
    <article className="group overflow-hidden rounded-[28px] bg-white shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <Link to={`/products/${product.id}`} className="block">
        <div className="gradient-product relative h-56 overflow-hidden p-6 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.22),transparent_30%)]" />
          <div className="relative flex h-full items-end justify-between">
            <div className="max-w-[70%]">
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-100">Featured pick</p>
              <h3 className="mt-3 text-2xl font-bold leading-tight">{product.name}</h3>
            </div>
            <div className="rounded-full bg-white/12 p-3">
              <PackageOpen className="h-5 w-5" />
            </div>
          </div>
        </div>
      </Link>

      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link to={`/products/${product.id}`} className="text-lg font-semibold text-slate-900 transition hover:text-primary">
              {product.name}
            </Link>
            <p className="mt-2 text-sm text-slate-500">
              {product.description || "A quality product ready to ship from the Shopping Store catalog."}
            </p>
          </div>
          <StockBadge stockQuantity={Number(product.stock_quantity)} />
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Price</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(product.price)}</p>
          </div>
          <Button onClick={() => onAddToCart(product)} disabled={isOutOfStock || isPending}>
            {isOutOfStock ? "Unavailable" : isPending ? "Adding..." : "Add to Cart"}
          </Button>
        </div>
      </div>
    </article>
  );
}
