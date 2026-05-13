import { Minus, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { Button } from "./ui/button";

export default function CartItem({
  item,
  product,
  onDecrease,
  onIncrease,
  onRemove,
  isUpdating,
  isRemoving,
}) {
  const quantity = Number(item.quantity ?? 0);
  const price = Number(product?.price ?? 0);

  return (
    <div className="flex flex-col gap-5 rounded-[28px] bg-white p-5 shadow-md sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="gradient-product h-24 w-24 rounded-3xl" />
        <div>
          <p className="text-lg font-semibold text-slate-900">{product?.name || "Product unavailable"}</p>
          <p className="mt-1 text-sm text-slate-500">Unit price: {formatCurrency(price)}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Product ID: {item.product_id?.slice?.(0, 8) || item.product_id}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 sm:justify-end">
        <div className="flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onDecrease}
            disabled={isUpdating || quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="min-w-10 text-center text-sm font-semibold text-slate-900">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={onIncrease}
            disabled={isUpdating}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-w-28">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Line Total</p>
          <p className="text-lg font-bold text-slate-900">{formatCurrency(price * quantity)}</p>
        </div>

        <Button variant="outline" onClick={onRemove} disabled={isRemoving}>
          <Trash2 className="mr-2 h-4 w-4" />
          {isRemoving ? "Removing..." : "Remove"}
        </Button>
      </div>
    </div>
  );
}
