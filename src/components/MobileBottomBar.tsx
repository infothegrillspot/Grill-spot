import { useState } from "react";
import { 
  Flame, 
  Utensils, 
  ShoppingBag, 
  Clock, 
  User, 
  Search, 
  Star,
  ArrowRight,
  PhoneCall
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { OrderHistoryDialog } from "./OrderHistoryDialog";
import { EditProfileDialog } from "./EditProfileDialog";

interface MobileBottomBarProps {
  onOpenAuth: () => void;
}

export const MobileBottomBar = ({ onOpenAuth }: MobileBottomBarProps) => {
  const { totalItems, subtotal, setIsCartOpen, isCartOpen, isOrdersOpen, setIsOrdersOpen } = useCart();
  const { user } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAccountClick = () => {
    if (user) {
      setIsProfileOpen(true);
    } else {
      onOpenAuth();
    }
  };

  return (
    <>
      <div 
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden pointer-events-none"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="p-3 space-y-2 pointer-events-auto">
          {/* Floating Cart Order Pill (When cart has items and drawer is closed) */}
          {totalItems > 0 && !isCartOpen && (
            <div className="w-full max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="w-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 rounded-2xl p-3 flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer border border-primary-foreground/10"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-black/20 flex items-center justify-center text-primary-foreground">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold leading-tight flex items-center gap-1.5">
                      <span>{totalItems} {totalItems === 1 ? "Item" : "Items"} in Cart</span>
                      <span className="opacity-75">•</span>
                      <span>Rs. {subtotal.toLocaleString()}</span>
                    </p>
                    <p className="text-[10px] text-primary-foreground/80 font-light">
                      Tap to review & checkout in Lahore
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider bg-black/20 px-3 py-1.5 rounded-full">
                  <span>View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          )}

          {/* Bottom Dock Navigation */}
          <nav 
            aria-label="Mobile Bottom Navigation"
            className="w-full max-w-md mx-auto bg-card/95 backdrop-blur-lg border border-border/80 rounded-2xl shadow-xl px-2 py-1.5 flex items-center justify-around"
          >
            {/* Menu */}
            <button
              type="button"
              onClick={() => scrollToSection("menu")}
              className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[44px] text-muted-foreground hover:text-foreground active:text-primary transition-colors cursor-pointer"
            >
              <Utensils className="w-4 h-4 mb-1 text-foreground" />
              <span className="text-[10px] font-medium tracking-tight">Menu</span>
            </button>

            {/* Popular */}
            <button
              type="button"
              onClick={() => scrollToSection("featured")}
              className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[44px] text-muted-foreground hover:text-foreground active:text-primary transition-colors cursor-pointer"
            >
              <Star className="w-4 h-4 mb-1 text-primary" />
              <span className="text-[10px] font-medium tracking-tight">Favorites</span>
            </button>

            {/* Cart Trigger */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[44px] text-muted-foreground hover:text-foreground active:text-primary transition-colors relative cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 mb-1 text-foreground" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-sm">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium tracking-tight">Cart</span>
            </button>

            {/* Orders */}
            <button
              id="mobile-dock-orders-btn"
              type="button"
              aria-label="View order history"
              onClick={() => setIsOrdersOpen(true)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[44px] transition-all cursor-pointer relative active:scale-95 ${
                isOrdersOpen
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground active:text-primary"
              }`}
            >
              <div className="relative">
                <Clock className={`w-4 h-4 mb-1 transition-transform ${isOrdersOpen ? "text-primary scale-110" : "text-foreground"}`} />
                {user && (
                  <span
                    title="Cloudflare D1 Synced"
                    className="absolute -top-0.5 -right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-card shadow-sm animate-pulse"
                  />
                )}
              </div>
              <span className="text-[10px] font-medium tracking-tight">Orders</span>
            </button>

            {/* Account */}
            <button
              type="button"
              onClick={handleAccountClick}
              className="flex-1 flex flex-col items-center justify-center py-1.5 px-1 min-h-[44px] text-muted-foreground hover:text-foreground active:text-primary transition-colors cursor-pointer"
            >
              {user ? (
                <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-bold mb-1">
                  {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                </div>
              ) : (
                <User className="w-4 h-4 mb-1 text-foreground" />
              )}
              <span className="text-[10px] font-medium tracking-tight">
                {user ? "Profile" : "Sign In"}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Dialogs spawned from Mobile Bar */}
      <OrderHistoryDialog
        open={isOrdersOpen}
        onOpenChange={setIsOrdersOpen}
      />

      <EditProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
      />
    </>
  );
};
