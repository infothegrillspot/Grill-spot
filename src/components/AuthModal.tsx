import { useState, useEffect } from "react";
import { 
  Flame, 
  LogOut, 
  ShieldCheck, 
  Check, 
  ShoppingBag, 
  Loader2,
  Zap,
  MapPin,
  Clock,
  Lock,
  Sparkles,
  ArrowRight,
  User,
  Phone
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
}

export const AuthModal = ({ isOpen, onClose, onOpenAdmin }: AuthModalProps) => {
  const { 
    user, 
    loading, 
    authModalReason,
    signInWithGoogle, 
    signOut, 
    updateUserProfile, 
    isAdmin 
  } = useAuth();

  const { pendingCartItem } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile editing state
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dietaryPreferences, setDietaryPreferences] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setDietaryPreferences(user.dietaryPreferences || "");
    }
  }, [user]);

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    try {
      const loggedUser = await signInWithGoogle();
      if (loggedUser) {
        if (loggedUser.role === "admin" && onOpenAdmin) {
          onClose();
          onOpenAdmin();
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        dietaryPreferences: dietaryPreferences.trim(),
      });
      onClose();
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-sm:fixed max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-none max-sm:rounded-t-3xl max-sm:rounded-b-none max-sm:border-b-0 max-sm:p-5 max-sm:pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] max-sm:max-h-[90vh] sm:max-w-md sm:rounded-2xl sm:p-6 overflow-y-auto border-border bg-card shadow-2xl"
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3 sm:hidden" />

        {!user ? (
          <div className="space-y-4">
            {/* Brand Logo & Welcoming Header */}
            <div className="text-center pt-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/25 flex items-center justify-center text-primary mx-auto mb-3 shadow-inner">
                <Flame className="w-7 h-7 text-primary" />
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-light tracking-tight text-foreground">
                {pendingCartItem ? "Complete Your Order" : "Welcome to The Grill Spot"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-light leading-relaxed max-w-xs mx-auto mt-1.5">
                {pendingCartItem 
                  ? "Sign in with your Google account to confirm your dish and start kitchen preparation in Lahore." 
                  : authModalReason || "Sign in or sign up with Google to order live charcoal BBQ, save delivery addresses, and track riders in real time."}
              </DialogDescription>
            </div>

            {/* Pending Cart Item Banner (If triggered by clicking an item) */}
            {pendingCartItem && (
              <div className="p-3 bg-primary/10 border border-primary/25 rounded-2xl flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-black/10 border border-primary/20">
                  <img 
                    src={pendingCartItem.item.image} 
                    alt={pendingCartItem.item.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-primary font-medium text-[10px] uppercase tracking-wider">
                    <ShoppingBag className="w-3 h-3" />
                    <span>Selected Dish</span>
                  </div>
                  <p className="font-semibold text-foreground truncate text-xs">
                    {pendingCartItem.quantity}x {pendingCartItem.item.name}
                  </p>
                  <p className="text-[11px] text-primary font-semibold">
                    Rs. {(pendingCartItem.item.price * pendingCartItem.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* The Google Sign-In / Sign-Up Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading || isSubmitting}
                className="w-full h-12 sm:h-12 bg-white dark:bg-card hover:bg-neutral-50 dark:hover:bg-accent text-neutral-800 dark:text-foreground font-medium text-xs sm:text-sm uppercase tracking-wider rounded-2xl border border-neutral-300 dark:border-border shadow-sm flex items-center justify-center gap-3 active:scale-[0.98] transition-all cursor-pointer min-h-[48px]"
              >
                {loading || isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
                )}
                <span>
                  {isSubmitting
                    ? "Connecting..."
                    : pendingCartItem
                    ? "Continue with Google & Order"
                    : "Continue with Google"}
                </span>
              </button>
            </div>

            {/* Mobile-Friendly Feature Perks */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center sm:flex-col sm:text-center gap-3 sm:gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div className="text-left sm:text-center">
                  <p className="text-xs font-semibold text-foreground">1-Tap Sign In</p>
                  <p className="text-[10px] text-muted-foreground font-light">No passwords to remember</p>
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center sm:flex-col sm:text-center gap-3 sm:gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="text-left sm:text-center">
                  <p className="text-xs font-semibold text-foreground">Saved Addresses</p>
                  <p className="text-[10px] text-muted-foreground font-light">Gulberg, DHA, Model Town</p>
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center sm:flex-col sm:text-center gap-3 sm:gap-1.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-left sm:text-center">
                  <p className="text-xs font-semibold text-foreground">Live Tracking</p>
                  <p className="text-[10px] text-muted-foreground font-light">Real-time rider updates</p>
                </div>
              </div>
            </div>

            {/* Privacy & Trust Footnote */}
            <div className="pt-2 text-center">
              <p className="text-[11px] text-muted-foreground flex items-center justify-center gap-1.5 font-light">
                <Lock className="w-3 h-3 text-muted-foreground/70" />
                <span>Secure Google authentication • No spam, ever</span>
              </p>
            </div>
          </div>
        ) : (
          /* Profile & Account Management Form (When Signed In) */
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <DialogHeader className="text-left mb-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-primary" />
                  <DialogTitle className="text-lg font-light">Your Grill Account</DialogTitle>
                </div>
                {isAdmin && (
                  <Badge className="bg-primary text-primary-foreground text-[10px]">
                    Admin
                  </Badge>
                )}
              </div>
              <DialogDescription className="text-xs text-muted-foreground font-light">
                Manage your Lahore delivery address, contact phone, and account details.
              </DialogDescription>
            </DialogHeader>

            {/* User Info Card */}
            <div className="flex items-center gap-3 p-3.5 bg-muted/40 rounded-2xl border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                {user.displayName ? user.displayName[0].toUpperCase() : "U"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {user.displayName || "Valued Customer"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate font-light">
                  {user.email}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium mb-1 flex items-center gap-1 text-foreground">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Full Name</span>
                </Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Ali Ahmed"
                  className="text-xs h-11 rounded-xl bg-card"
                />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1 flex items-center gap-1 text-foreground">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Phone Number (for Delivery Rider)</span>
                </Label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+92 300 1234567"
                  className="text-xs h-11 rounded-xl bg-card"
                />
              </div>

              <div>
                <Label className="text-xs font-medium mb-1 flex items-center gap-1 text-foreground">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Saved Delivery Address</span>
                </Label>
                <Textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House #, Street, Block, Area, Lahore..."
                  className="text-xs h-20 rounded-xl resize-none bg-card leading-relaxed"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="text-xs text-destructive hover:text-destructive gap-1.5 rounded-full h-10 px-4 min-h-[40px]"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </Button>

              <div className="flex items-center gap-2">
                {isAdmin && onOpenAdmin && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onClose();
                      onOpenAdmin();
                    }}
                    className="text-xs rounded-full h-10 px-3.5 border-primary text-primary min-h-[40px]"
                  >
                    Admin
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={isSaving}
                  size="sm"
                  className="bg-primary text-primary-foreground text-xs rounded-full h-10 px-5 font-medium min-h-[40px]"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Save Profile
                </Button>
              </div>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
