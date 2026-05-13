import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { getCart, removeCartItem, updateCartItem } from "../api/cartApi";
import { getProducts } from "../api/productApi";
import { createOrder } from "../api/orderApi";
import CartItem from "../components/CartItem";
import { Button } from "../components/ui/button";
import { formatCurrency, getErrorMessage } from "../lib/utils";

export default function Cart() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
  });

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }) =>
      updateCartItem(productId, {
        quantity,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not update cart item"));
    },
  });

  const removeMutation = useMutation({
    mutationFn: (productId) => removeCartItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Item removed from cart");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not remove item"));
    },
  });

  const orderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Order placed successfully");
      navigate("/orders");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Could not place order"));
    },
  });

  const productsById = useMemo(() => {
    const map = new Map();
    (productsQuery.data ?? []).forEach((product) => {
      map.set(product.id, product);
    });
    return map;
  }, [productsQuery.data]);

  const cartItems = cartQuery.data?.items ?? [];

  const subtotal = cartItems.reduce((total, item) => {
    const product = productsById.get(item.product_id);
    return total + Number(product?.price ?? 0) * Number(item.quantity ?? 0);
  }, 0);

  if (cartQuery.isLoading || productsQuery.isLoading) {
    return (
      <div className="page-shell rounded-[32px] bg-white p-10 shadow-md">
        <div className="space-y-4">
          <div className="h-10 w-56 animate-pulse rounded-full bg-slate-200" />
          <div className="h-32 animate-pulse rounded-[28px] bg-slate-100" />
          <div className="h-32 animate-pulse rounded-[28px] bg-slate-100" />
        </div>
      </div>
    );
  }

  if (cartQuery.isError) {
    return (
      <div className="page-shell rounded-[32px] bg-white p-10 text-center shadow-md">
        <h2 className="text-2xl font-bold text-slate-900">Could not load your cart</h2>
        <p className="mt-3 text-slate-500">{getErrorMessage(cartQuery.error)}</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="page-shell flex min-h-[70vh] items-center justify-center">
        <div className="max-w-2xl rounded-[36px] bg-white p-10 text-center shadow-soft">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-indigo-50 text-primary">
            <ShoppingCart className="h-12 w-12" />
          </div>
          <h1 className="mt-8 text-4xl font-extrabold text-slate-900">Your cart is empty</h1>
          <p className="mt-4 text-slate-500">
            Start adding products from the catalog and they’ll appear here with live totals.
          </p>
          <Button className="mt-8" onClick={() => navigate("/")}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell grid gap-8 xl:grid-cols-[1fr_360px]">
      <section className="space-y-5">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Your cart</p>
          <h1 className="mt-2 text-4xl font-extrabold text-slate-900">Almost ready to checkout</h1>
        </div>

        {cartItems.map((item) => (
          <CartItem
            key={item.id}
            item={item}
            product={productsById.get(item.product_id)}
            onDecrease={() =>
              updateMutation.mutate({
                productId: item.product_id,
                quantity: Math.max(1, Number(item.quantity) - 1),
              })
            }
            onIncrease={() =>
              updateMutation.mutate({
                productId: item.product_id,
                quantity: Number(item.quantity) + 1,
              })
            }
            onRemove={() => removeMutation.mutate(item.product_id)}
            isUpdating={updateMutation.isPending && updateMutation.variables?.productId === item.product_id}
            isRemoving={removeMutation.isPending && removeMutation.variables === item.product_id}
          />
        ))}
      </section>

      <aside className="h-fit rounded-[32px] bg-white p-6 shadow-soft">
        <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Order summary</p>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">Review totals</h2>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Items</span>
            <span>{cartItems.reduce((total, item) => total + Number(item.quantity), 0)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="border-t border-dashed border-slate-200 pt-4">
            <div className="flex items-center justify-between text-lg font-bold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
          </div>
        </div>

        <Button
          size="lg"
          className="mt-8 w-full"
          onClick={() => orderMutation.mutate()}
          disabled={orderMutation.isPending}
        >
          {orderMutation.isPending ? "Placing order..." : "Place Order"}
        </Button>

        <Link
          to="/"
          className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-indigo-500"
        >
          Continue shopping
          <ArrowRight className="h-4 w-4" />
        </Link>
      </aside>
    </div>
  );
}
