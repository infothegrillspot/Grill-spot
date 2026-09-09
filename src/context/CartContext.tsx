import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  notes?: string;
}

export type OrderType = "delivery" | "dinein" | "takeaway";

export interface PendingCartItem {
  item: {
    id: string;
    name: string;
    price: number;
    image: string;
    notes?: string;
  };
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (
    item: { id: string; name: string; price: number; image: string; notes?: string },
    quantity?: number
  ) => boolean;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  isOrdersOpen: boolean;
  setIsOrdersOpen: (isOpen: boolean) => void;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pendingCartItem: PendingCartItem | null;
  clearPendingCartItem: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, openAuthModal } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingCartItem, setPendingCartItem] = useState<PendingCartItem | null>(() => {
    try {
      const saved = sessionStorage.getItem("the_grill_spot_pending_cart");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Load user-specific cart when user logs in or changes
  useEffect(() => {
    if (user?.uid) {
      const storageKey = `the_grill_spot_cart_${user.uid}`;
      try {
        const savedCart = localStorage.getItem(storageKey);
        let currentItems: CartItem[] = savedCart ? JSON.parse(savedCart) : [];

        // If there was a pending item from before sign-in/sign-up, add it now!
        if (pendingCartItem) {
          const { item, quantity } = pendingCartItem;
          const existingIndex = currentItems.findIndex((i) => i.id === item.id);
          if (existingIndex > -1) {
            currentItems = currentItems.map((i, idx) =>
              idx === existingIndex ? { ...i, quantity: i.quantity + quantity } : i
            );
          } else {
            currentItems = [...currentItems, { ...item, quantity }];
          }

          toast.success(`Added ${quantity}x ${item.name} to your cart!`, {
            description: `Welcome, ${user.displayName || "Customer"}! Your selection has been saved.`,
          });

          // Clear pending item
          setPendingCartItem(null);
          try {
            sessionStorage.removeItem("the_grill_spot_pending_cart");
          } catch {
            // ignore
          }

          // Automatically open cart drawer so user sees their added item
          setIsCartOpen(true);
        }

        setCart(currentItems);
      } catch (err) {
        console.warn("Failed loading saved cart:", err);
        setCart([]);
      }
    } else {
      // User signed out or not logged in: cart is empty
      setCart([]);
    }
  }, [user?.uid, user?.displayName, pendingCartItem]);

  // Save cart to user's storage key whenever cart changes
  useEffect(() => {
    if (user?.uid) {
      const storageKey = `the_grill_spot_cart_${user.uid}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(cart));
      } catch {
        // ignore
      }
    }
  }, [cart, user?.uid]);

  const clearPendingCartItem = () => {
    setPendingCartItem(null);
    try {
      sessionStorage.removeItem("the_grill_spot_pending_cart");
    } catch {
      // ignore
    }
  };

  const addToCart = (
    item: { id: string; name: string; price: number; image: string; notes?: string },
    quantity: number = 1
  ): boolean => {
    // Gate add-to-cart: User MUST be signed in or signed up!
    if (!user) {
      const pending: PendingCartItem = { item, quantity };
      setPendingCartItem(pending);
      try {
        sessionStorage.setItem("the_grill_spot_pending_cart", JSON.stringify(pending));
      } catch {
        // ignore
      }

      openAuthModal(`Sign in with Google to add ${item.name} to your cart.`);

      toast.info("Sign in with Google to add to cart", {
        description: `Sign in with Google to add ${quantity}x ${item.name} (Rs. ${(item.price * quantity).toLocaleString()}) and customize your order.`,
        action: {
          label: "Google Sign-In",
          onClick: () => openAuthModal(`Sign in with Google to add ${item.name} to your cart.`),
        },
        duration: 6000,
      });

      return false;
    }

    // User is logged in: proceed with normal add
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((i) => i.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
        return updated;
      }
      return [...prevCart, { ...item, quantity }];
    });

    toast.success(`Added ${quantity}x ${item.name} to cart`, {
      description: `Rs. ${(item.price * quantity).toLocaleString()}`,
    });

    return true;
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
    if (user?.uid) {
      try {
        localStorage.removeItem(`the_grill_spot_cart_${user.uid}`);
      } catch {
        // ignore
      }
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        isOrdersOpen,
        setIsOrdersOpen,
        orderType,
        setOrderType,
        searchQuery,
        setSearchQuery,
        pendingCartItem,
        clearPendingCartItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
