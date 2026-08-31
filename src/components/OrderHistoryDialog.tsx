import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { fetchD1Orders, D1Order } from "@/lib/d1Api";
import { subscribeToOrders, OrderRecord } from "@/services/firebaseDb";
import {
  Clock,
  ShoppingBag,
  RotateCcw,
  CheckCircle2,
  Bike,
  Store,
  Utensils,
  ChevronRight,
  AlertCircle,
  Loader2,
  MapPin,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface OrderHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrderHistoryDialog = ({ open, onOpenChange }: OrderHistoryDialogProps) => {
  const { user } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const [orders, setOrders] = useState<D1Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<D1Order | null>(null);

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    setLoading(true);

    const loadOrders = async () => {
      try {
        // 1. Try D1 API for this user
        const d1Orders = await fetchD1Orders(user?.uid);
        if (isMounted && d1Orders && d1Orders.length > 0) {
          setOrders(d1Orders);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Could not fetch D1 orders:", err);
      }

      // 2. Fallback to Firestore real-time subscription
      const unsubscribe = subscribeToOrders((fsOrders: OrderRecord[]) => {
        if (!isMounted) return;
        
        // Filter by user ID if logged in, otherwise show latest
        const userOrders = user?.uid 
          ? fsOrders.filter((o) => o.userId === user.uid || (o.customerName && o.customerName === user.displayName))
          : fsOrders.slice(0, 5);

        const mapped: D1Order[] = userOrders.map((o) => ({
          id: o.id || "order-temp",
          userId: o.userId,
          customerName: o.customerName || "Customer",
          phone: o.phone || "",
          orderType: (o.orderType === "takeaway" ? "takeaway" : o.orderType === "delivery" ? "delivery" : "dine_in"),
          subtotal: o.subtotal,
          deliveryFee: o.deliveryFee,
          grandTotal: o.grandTotal,
          address: o.address || "",
          specialInstructions: o.specialInstructions,
          status: (o.status === "delivering" ? "out_for_delivery" : o.status === "completed" ? "delivered" : o.status) as D1Order["status"],
          items: o.items.map((it) => ({
            id: it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            notes: it.notes,
          })),
          createdAt: typeof o.createdAt === "string" ? o.createdAt : new Date().toISOString(),
        }));

        setOrders(mapped);
        setLoading(false);
      });

      return () => {
        unsubscribe();
      };
    };

    loadOrders();

    return () => {
      isMounted = false;
    };
  }, [open, user]);

  const handleReorder = (order: D1Order) => {
    order.items.forEach((item) => {
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
        notes: item.notes,
      });
    });

    toast.success("Items added to your cart!", {
      description: `Added ${order.items.length} item(s) from Order #${order.id.slice(-6).toUpperCase()}`,
    });
    onOpenChange(false);
    setIsCartOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "delivered":
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </span>
        );
      case "out_for_delivery":
      case "delivering":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
            <Bike className="w-3 h-3" /> Out for Delivery
          </span>
        );
      case "preparing":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
            <Utensils className="w-3 h-3" /> On the Grill
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-medium">
            <AlertCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            <Clock className="w-3 h-3" /> Order Received
          </span>
        );
    }
  };

  const formatOrderDate = (dateStr?: string) => {
    if (!dateStr) return "Recently";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto bg-card border-border p-6">
        <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <Clock className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-semibold">
              Dining & Takeaway
            </span>
          </div>
          <DialogTitle className="text-xl font-light tracking-tight flex items-center justify-between">
            <span>Order History</span>
            <span className="text-xs font-normal text-muted-foreground">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-light">
            Track live grill orders or re-order your favorite burgers, BBQ and pizzas.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
            <p className="text-xs text-muted-foreground font-light">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-accent text-muted-foreground flex items-center justify-center mx-auto">
              <ShoppingBag className="w-6 h-6 stroke-1" />
            </div>
            <h3 className="text-base font-normal text-foreground">No orders yet</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto font-light leading-relaxed">
              When you place an order for delivery or takeaway at The Grill Spot Lahore, it will appear here.
            </p>
            <Button
              size="sm"
              className="rounded-full text-xs font-normal mt-2"
              onClick={() => onOpenChange(false)}
            >
              Explore Menu
            </Button>
          </div>
        ) : (
          <div className="space-y-4 pt-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-xl border border-border bg-background/60 hover:bg-background transition-colors space-y-3"
              >
                {/* Top Row: Order ID, Date & Status */}
                <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-foreground">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-light capitalize">
                        {order.orderType === "delivery" ? (
                          <Bike className="w-3 h-3 text-primary" />
                        ) : order.orderType === "takeaway" ? (
                          <Store className="w-3 h-3 text-primary" />
                        ) : (
                          <Utensils className="w-3 h-3 text-primary" />
                        )}
                        {order.orderType}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-light mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{formatOrderDate(order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(order.status)}
                    <span className="text-xs font-medium text-primary">
                      Rs. {order.grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="space-y-1.5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-light">
                      <span className="text-foreground/90 truncate max-w-[280px]">
                        {item.quantity}x {item.name}
                      </span>
                      <span className="text-muted-foreground font-mono">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Address (for delivery) */}
                {order.address && (
                  <div className="text-[11px] text-muted-foreground font-light flex items-center gap-1.5 pt-1 border-t border-border/40 truncate">
                    <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                    <span className="truncate">{order.address}</span>
                  </div>
                )}

                {/* Rider Info if assigned */}
                {order.riderName && (
                  <div className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/20 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bike className="w-3.5 h-3.5 text-blue-500" />
                      <div>
                        <p className="text-[11px] font-medium text-foreground">
                          Rider: {order.riderName}
                        </p>
                        {order.riderPhone && (
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {order.riderPhone}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-medium">
                      En Route
                    </span>
                  </div>
                )}

                {/* Actions: Reorder */}
                <div className="pt-2 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-full text-xs font-normal border-primary/30 text-primary hover:bg-primary/5"
                    onClick={() => handleReorder(order)}
                  >
                    <RotateCcw className="w-3 h-3 mr-1.5" />
                    Reorder Items
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
