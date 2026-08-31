import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Flame, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  LogOut, 
  ShieldCheck, 
  Check, 
  ShoppingBag, 
  Loader2,
  X
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
}

export const AuthModal = ({ isOpen, onClose, onOpenAdmin }: AuthModalProps) => {
  const { user, loading, signInWithGoogle, signOut, updateUserProfile, isAdmin } = useAuth();

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
    const loggedUser = await signInWithGoogle();
    if (loggedUser) {
      toast.success(`Welcome back, ${loggedUser.displayName || "Customer"}!`);
      if (loggedUser.role === "admin" && onOpenAdmin) {
        onClose();
        onOpenAdmin();
      }
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
      toast.success("Profile updated successfully!");
      onClose();
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-6 border-border bg-card">
        <DialogHeader className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-5 h-5 text-primary" />
            <DialogTitle className="text-xl font-light">
              {user ? "Your Grill Account" : "Sign In & Order"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground font-light">
            {user
              ? "Manage your delivery contact details and saved preferences"
              : "Sign in with Google to prefill delivery address, save favorite platters, and track orders in real-time"}
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="space-y-4 py-2">
            <Button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full font-medium text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              Continue with Google
            </Button>

            <div className="p-4 bg-muted/40 rounded-xl border border-border space-y-2 text-xs text-muted-foreground font-light">
              <div className="flex items-center gap-2 text-foreground font-medium">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Instant & Secure</span>
              </div>
              <p>
                No password needed. Saves your contact details, street address, and live rider tracking for every delivery.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {user.displayName ? user.displayName[0].toUpperCase() : "U"}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{user.displayName || "Valued Customer"}</p>
                  <p className="text-[11px] text-muted-foreground font-light">{user.email}</p>
                </div>
              </div>
              {isAdmin && (
                <Badge className="bg-primary text-primary-foreground text-[10px]">
                  Admin
                </Badge>
              )}
            </div>

            <div>
              <Label className="text-xs font-medium mb-1 block">Full Name</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Ali Ahmed"
                className="text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-medium mb-1 block">Phone Number (for Rider)</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="text-xs h-9"
              />
            </div>

            <div>
              <Label className="text-xs font-medium mb-1 block">Saved Delivery Address</Label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House #, Street, Block, Area, Lahore..."
                className="text-xs h-18 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="text-xs text-destructive hover:text-destructive gap-1 rounded-full h-8"
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
                    className="text-xs rounded-full h-8 border-primary text-primary"
                  >
                    Open Admin
                  </Button>
                )}

                <Button
                  type="submit"
                  disabled={isSaving}
                  size="sm"
                  className="bg-primary text-primary-foreground text-xs rounded-full h-8 px-4"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
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
