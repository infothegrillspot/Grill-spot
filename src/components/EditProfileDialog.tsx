import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Phone, MapPin, Sparkles, Loader2, ShieldCheck, Flame } from "lucide-react";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
  const { user, updateUserProfile, isAdmin } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [favoriteBranch, setFavoriteBranch] = useState("Gulberg III");
  const [dietaryPreferences, setDietaryPreferences] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setFavoriteBranch(user.favoriteBranch || "Gulberg III");
      setDietaryPreferences(user.dietaryPreferences || "");
    }
  }, [user, open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      return;
    }

    setIsSaving(true);
    const success = await updateUserProfile({
      displayName: displayName.trim(),
      photoURL: photoURL.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      favoriteBranch,
      dietaryPreferences: dietaryPreferences.trim() || null,
    });
    setIsSaving(false);

    if (success) {
      onOpenChange(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto bg-card border-border p-6">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-normal">
              Member Profile
            </span>
          </div>
          <DialogTitle className="text-xl font-light tracking-tight flex items-center justify-between">
            <span>Edit Profile</span>
            {isAdmin && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-light">
            Update your contact information, delivery address, and grill dining preferences.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          {/* Avatar Preview */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-accent/40 border border-border">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover border border-primary/30"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-lg font-medium">
                {(displayName || user.email || "G")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName || "Your Name"}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-name" className="text-xs text-foreground/80 flex items-center gap-1.5 font-normal">
                <User className="w-3.5 h-3.5 text-muted-foreground" /> Full Name
              </Label>
              <Input
                id="profile-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Hamza Malik"
                className="h-9 text-xs"
                required
              />
            </div>

            {/* Email (Read only) */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-email" className="text-xs text-foreground/80 flex items-center gap-1.5 font-normal">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email Address
              </Label>
              <Input
                id="profile-email"
                value={user.email || ""}
                disabled
                className="h-9 text-xs bg-muted/40 text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone" className="text-xs text-foreground/80 flex items-center gap-1.5 font-normal">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone Number (Pakistan)
              </Label>
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="h-9 text-xs"
              />
            </div>

            {/* Preferred Lahore Branch */}
            <div className="space-y-1.5">
              <Label className="text-xs text-foreground/80 flex items-center gap-1.5 font-normal">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Favorite Lahore Branch
              </Label>
              <Select value={favoriteBranch} onValueChange={setFavoriteBranch}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gulberg III">Gulberg III (Main Boulevard / MM Alam)</SelectItem>
                  <SelectItem value="DHA Phase 5">DHA Phase 5 (Commercial Hub)</SelectItem>
                  <SelectItem value="Mall Road / Cantt">Mall Road & Cantt Historic Branch</SelectItem>
                  <SelectItem value="Bahria Town">Bahria Town Lahore</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Delivery Address */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-address" className="text-xs text-foreground/80 flex items-center gap-1.5 font-normal">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Delivery Street Address (Lahore)
              </Label>
              <Input
                id="profile-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. House 42, Sector Y, Phase 3 DHA, Lahore"
                className="h-9 text-xs"
              />
            </div>

            {/* Avatar URL (Optional custom image) */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-photo" className="text-xs text-foreground/80 flex items-center gap-1.5 font-normal">
                <Sparkles className="w-3.5 h-3.5 text-muted-foreground" /> Custom Avatar URL (Optional)
              </Label>
              <Input
                id="profile-photo"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://..."
                className="h-9 text-xs"
              />
            </div>

            {/* Dietary Preferences / Notes */}
            <div className="space-y-1.5">
              <Label htmlFor="profile-diet" className="text-xs text-foreground/80 font-normal">
                Dietary & Grill Preferences (Spicy level, allergies)
              </Label>
              <Textarea
                id="profile-diet"
                value={dietaryPreferences}
                onChange={(e) => setDietaryPreferences(e.target.value)}
                placeholder="e.g. Extra spicy charcoal spice blend, well-done lamb chops, no garlic sauce..."
                className="text-xs resize-none min-h-[60px]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs font-normal"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-normal"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
