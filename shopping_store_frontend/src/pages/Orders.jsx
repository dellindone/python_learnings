import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ClipboardList } from "lucide-react";
import { cancelOrder, getOrders } from "../api/orderApi";
import OrderCard from "../components/OrderCard";
import { getErrorMessage } from "../lib/utils";

export default function Orders() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order cancelled");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not cancel order"));
    },
  });

  const orders = useMemo(
    () =>
      [...(ordersQuery.data ?? [])].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    [ordersQuery.data],
  );

  if (ordersQuery.isLoading) {
    return (
      <div className="page-shell rounded-[32px] bg-white p-10 shadow-md">
        <div className="space-y-4">
          <div className="h-10 w-64 animate-pulse rounded-full bg-slate-200" />
          <div className="h-40 animate-pulse rounded-[28px] bg-slate-100" />
          <div className="h-40 animate-pulse rounded-[28px] bg-slate-100" />
        </div>
      </div>
    );
  }

  if (ordersQuery.isError) {
    return (
      <div className="page-shell rounded-[32px] bg-white p-10 text-center shadow-md">
        <h2 className="text-2xl font-bold text-slate-900">Could not load orders</h2>
        <p className="mt-3 text-slate-500">{getErrorMessage(ordersQuery.error)}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="page-shell flex min-h-[70vh] items-center justify-center">
        <div className="max-w-xl rounded-[36px] bg-white p-10 text-center shadow-soft">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-indigo-50 text-primary">
            <ClipboardList className="h-10 w-10" />
          </div>
          <h1 className="mt-8 text-4xl font-extrabold text-slate-900">No orders yet</h1>
          <p className="mt-4 text-slate-500">
            Once you place an order from the cart, it will appear here with item snapshots and status badges.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell space-y-6">
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Order history</p>
        <h1 className="mt-2 text-4xl font-extrabold text-slate-900">Track every order</h1>
      </div>

      <div className="space-y-5">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onCancel={(orderId) => cancelMutation.mutate(orderId)}
            isCancelling={cancelMutation.isPending && cancelMutation.variables === order.id}
          />
        ))}
      </div>
    </div>
  );
}
