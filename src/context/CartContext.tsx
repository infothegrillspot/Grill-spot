import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  notes?: string;
}

export type OrderType = "delivery" | "dinein" | "takeaway";

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: { id: string; name: string; price: number; image: string; notes?: string }, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "the_grill_spot_cart_lahore";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    // Default initial item so cart is ready to preview
    return [
      {
        id: "burgers",
        name: "Classic Smashed Burger",
        price: 1450,
        quantity: 1,
        image: "/src/assets/menu-burger.jpg",
        notes: "Double patty, cheddar, spot sauce",
      },
    ];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("delivery");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const addToCart = (
    item: { id: string; name: string; price: number; image: string; notes?: string },
    quantity: number = 1
  ) => {
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
        orderType,
        setOrderType,
        searchQuery,
        setSearchQuery,
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
