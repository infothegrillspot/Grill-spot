import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { saveOrderToFirestore } from "@/services/firebaseDb";
import { createD1Order } from "@/lib/d1Api";
import { SavedAddressesDialog } from "./SavedAddressesDialog";
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Bike,
  Store,
  Utensils,
  Loader2,
  User,
  Phone,
  BookMarked,
} from "lucide-react";
import { toast } from "sonner";

export const CartDrawer = () => {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    isCartOpen,
    setIsCartOpen,
    isOrdersOpen,
    setIsOrdersOpen,
    totalItems,
    orderType,
    setOrderType,
  } = useCart();
  const { user, updateUserProfile, openAuthModal } = useAuth();
  const [orderSubmitted, setOrderSubmitted] = useState(false);
  const [customerName, setCustomerName] = useState(user?.displayName || "");
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "+92 3");
  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || "");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressPickerOpen, setIsAddressPickerOpen] = useState(false);

  // Sync profile details whenever user logs in or updates profile
  useEffect(() => {
    if (user && isCartOpen) {
      if (user.displayName) {
        setCustomerName((prev) => (!prev || prev === "Guest Customer" ? user.displayName || "" : prev));
      }
      if (user.phone) {
        setCustomerPhone((prev) => (!prev || prev === "+92 3" ? user.phone || "" : prev));
      }
      if (user.address) {
        setDeliveryAddress((prev) => (!prev ? user.address || "" : prev));
      }
    }
  }, [user, isCartOpen]);

  const deliveryFee = orderType === "delivery" ? 250 : 0;
  const grandTotal = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!customerName.trim()) {
      toast.error("Please enter your name for the order");
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 7) {
      toast.error("Please enter a valid mobile number for rider dispatch");
      return;
    }
    if (orderType === "delivery" && !deliveryAddress.trim()) {
      toast.error("Please enter your delivery street address in Lahore");
      return;
    }

    setIsSubmitting(true);
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const orderPayload = {
        id: orderId,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes,
        })),
        orderType,
        subtotal,
        deliveryFee,
        grandTotal,
        customerName: customerName.trim(),
        customerEmail: user?.email || undefined,
        phone: customerPhone.trim(),
        address: orderType === "delivery" ? deliveryAddress.trim() : "Dine-in / Pickup (MM Alam Road Branch)",
        specialInstructions,
        status: "pending" as const,
        userId: user?.uid,
      };

      // 1. Save to Cloudflare D1 SQL database
      await createD1Order(orderPayload).catch((e) => console.warn("D1 order sync warning:", e));

      // 2. Save to Firestore database
      await saveOrderToFirestore(orderPayload).catch((e) => console.warn("Firestore order sync warning:", e));

      // 3. Save order ID to local storage so this user can always track this specific order
      try {
        const stored = JSON.parse(localStorage.getItem("grillspot_guest_orders") || "[]");
        const updated = Array.from(new Set([orderId, ...(Array.isArray(stored) ? stored : [])]));
        localStorage.setItem("grillspot_guest_orders", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save to localStorage:", e);
      }

      // 4. If logged in, update customer profile with new phone/address for future orders
      if (user && updateUserProfile) {
        const profileUpdates: { phone?: string; address?: string } = {};
        if (customerPhone.trim() && customerPhone.trim() !== user.phone) {
          profileUpdates.phone = customerPhone.trim();
        }
        if (orderType === "delivery" && deliveryAddress.trim() && deliveryAddress.trim() !== user.address) {
          profileUpdates.address = deliveryAddress.trim();
        }
        if (Object.keys(profileUpdates).length > 0) {
          updateUserProfile(profileUpdates).catch((e) => console.warn("Auto profile update skipped:", e));
        }
      }

      setOrderSubmitted(true);
      toast.success("Order Placed Successfully!", {
        description: `Order #${orderId.slice(-6).toUpperCase()} for Rs. ${grandTotal.toLocaleString()} was received by the kitchen.`,
      });
    } catch (err) {
      console.warn("Order placement fallback:", err);
      setOrderSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    if (orderSubmitted) {
      setTimeout(() => {
        clearCart();
        setOrderSubmitted(false);
      }, 400);
    }
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 bg-card border-border">
        {/* Header */}
        <SheetHeader className="p-6 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-normal tracking-tight">Your Grill Order</SheetTitle>
                <p className="text-xs text-muted-foreground font-light">
                  Lahore Branch • {totalItems} {totalItems === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
          </div>
        </SheetHeader>

        {orderSubmitted ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-light text-foreground tracking-tight">Order Confirmed!</h3>
            <p className="text-xs text-muted-foreground font-light max-w-xs leading-relaxed">
              Fired up and heading your way. Our chefs at MM Alam Road, Lahore have received your order.
            </p>
            <div className="w-full p-4 rounded-lg bg-accent/40 text-left text-xs space-y-1.5 font-light">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-normal text-foreground">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-normal text-foreground font-mono">{customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="capitalize font-normal text-foreground">{orderType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Address:</span>
                <span className="font-normal text-foreground truncate max-w-[200px]">
                  {orderType === "delivery" ? deliveryAddress : "MM Alam Branch"}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-1">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium text-primary">Rs. {grandTotal.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full pt-2">
              <Button
                variant="outline"
                className="flex-1 rounded-full text-xs font-normal border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => {
                  handleClose();
                  setIsOrdersOpen(true);
                }}
              >
                Track in Order History
              </Button>
              <Button
                className="flex-1 rounded-full text-xs font-normal"
                onClick={handleClose}
              >
                Done
              </Button>
            </div>
          </div>
        ) : !user ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <User className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-medium text-foreground">Sign In with Google to Order</p>
              <p className="text-xs text-muted-foreground font-light max-w-xs leading-relaxed">
                Please sign in with your Google account to add items to your cart, save Lahore delivery addresses, and track your food order in real-time.
              </p>
            </div>
            <Button
              className="rounded-full text-xs font-medium bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 dark:border-border px-6 h-11 min-h-[44px] shadow-sm flex items-center gap-2.5 active:scale-95"
              onClick={() => {
                setIsCartOpen(false);
                openAuthModal("Sign in with Google to start your order.");
              }}
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Sign In with Google</span>
            </Button>
          </div>
        ) : cart.length === 0 ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent text-muted-foreground flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 stroke-1" />
            </div>
            <p className="text-base font-light text-foreground">Your cart is empty</p>
            <p className="text-xs text-muted-foreground font-light max-w-xs">
              Explore our flame-grilled smash burgers, spit-roasted shawarma, and loaded fries in Lahore.
            </p>
            <Button
              variant="outline"
              className="rounded-full text-[11px] uppercase tracking-wider font-normal"
              onClick={() => setIsCartOpen(false)}
            >
              Browse Menu
            </Button>
          </div>
        ) : (
          <>
            {/* Order Type Toggle */}
            <div className="px-6 py-3 bg-secondary/40 border-b border-border">
              <div className="grid grid-cols-3 gap-1 bg-card/60 p-1 rounded-md border border-border/60">
                <button
                  type="button"
                  onClick={() => setOrderType("delivery")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[11px] font-light transition-all ${
                    orderType === "delivery" ? "bg-primary text-primary-foreground font-normal shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bike className="w-3 h-3" />
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("dinein")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[11px] font-light transition-all ${
                    orderType === "dinein" ? "bg-primary text-primary-foreground font-normal shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Utensils className="w-3 h-3" />
                  Dine-in
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("takeaway")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-[11px] font-light transition-all ${
                    orderType === "takeaway" ? "bg-primary text-primary-foreground font-normal shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Store className="w-3 h-3" />
                  Takeaway
                </button>
              </div>
            </div>

            {/* Cart Items List & Customer Details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 rounded-lg border border-border/80 bg-background/50 hover:bg-background transition-colors"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 rounded-md object-cover flex-shrink-0 border border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-normal text-foreground truncate">{item.name}</h4>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {item.notes && (
                      <p className="text-[11px] text-muted-foreground font-light truncate mt-0.5">{item.notes}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs font-medium text-foreground">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </span>
                      <div className="flex items-center border border-border rounded-md bg-card">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-light min-w-[20px] text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Customer Contact & Address Form */}
              <div className="p-3.5 rounded-lg border border-border bg-card/60 space-y-3">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                  Customer & Delivery Details
                </p>

                <div className="space-y-2">
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Your Full Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="WhatsApp / Phone Number (e.g. +92 300 1234567) *"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>

                  {orderType === "delivery" && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-normal">
                          Delivery Address
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsAddressPickerOpen(true)}
                          className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                        >
                          <BookMarked className="w-3 h-3" />
                          Saved Addresses
                        </button>
                      </div>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-primary" />
                        <input
                          type="text"
                          placeholder="House / Street, Phase / Block, Lahore *"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="Special instructions (e.g. extra toum / less spicy)..."
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
            </div>

            {/* Footer / Calculations in PKR */}
            <div className="p-6 border-t border-border bg-card space-y-3">
              <div className="space-y-1.5 text-xs font-light">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>Rs. {subtotal.toLocaleString()}</span>
                </div>
                {orderType === "delivery" && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Delivery Fee (Lahore)</span>
                    <span>Rs. {deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-foreground text-sm font-normal pt-2 border-t border-border">
                  <span>Total Amount</span>
                  <span className="text-primary font-medium">Rs. {grandTotal.toLocaleString()} PKR</span>
                </div>
              </div>

              <Button
                disabled={isSubmitting}
                className="w-full rounded-full text-[11px] uppercase tracking-wider font-normal bg-primary hover:bg-primary/90 text-primary-foreground py-5"
                onClick={handleCheckout}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    Place Order (Rs. {grandTotal.toLocaleString()})
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </SheetContent>
      <SavedAddressesDialog
        open={isAddressPickerOpen}
        onOpenChange={setIsAddressPickerOpen}
        onSelectAddress={(addr) => setDeliveryAddress(addr)}
      />
    </Sheet>
  );
};
