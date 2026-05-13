import { useState } from "react";
import { ChevronDown, ChevronUp, PackageCheck } from "lucide-react";
import { Button } from "./ui/button";
import { formatCurrency, formatDate } from "../lib/utils";

const statusClasses = {
  pending: "bg-yellow-50 text-yellow-700",
  confirmed: "bg-blue-50 text-blue-700",
  shipped: "bg-violet-50 text-violet-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function OrderCard({ order, onCancel, isCancelling }) {
  const [expanded, setExpanded] = useState(false);
  const normalizedStatus = String(order.status || "").toLowerCase();

  return (
    <article className="rounded-[30px] bg-white p-6 shadow-md">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-primary">
            <PackageCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Order #{String(order.id).slice(0, 8)}</p>
            <h3 className="mt-2 text-xl font-bold text-slate-900">{formatCurrency(order.total_amount)}</h3>
            <p className="mt-1 text-sm text-slate-500">{formatDate(order.created_at)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
              statusClasses[normalizedStatus] || "bg-slate-100 text-slate-700"
            }`}
          >
            {order.status}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {order.items?.length || 0} items
          </span>
          {normalizedStatus === "pending" ? (
            <Button variant="outline" onClick={() => onCancel(order.id)} disabled={isCancelling}>
              {isCancelling ? "Cancelling..." : "Cancel Order"}
            </Button>
          ) : null}
          <Button variant="ghost" onClick={() => setExpanded((value) => !value)}>
            {expanded ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
            {expanded ? "Hide items" : "View items"}
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-6 space-y-3 border-t border-slate-100 pt-6">
          {order.items?.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 rounded-2xl bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-900">{item.product_name}</p>
                <p className="text-sm text-slate-500">
                  Qty {item.quantity} x {formatCurrency(item.unit_price)}
                </p>
              </div>
              <p className="text-base font-bold text-slate-900">{formatCurrency(item.subtotal)}</p>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}
