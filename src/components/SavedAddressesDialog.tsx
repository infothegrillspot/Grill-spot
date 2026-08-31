import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { MapPin, Plus, Trash2, Check, Home, Briefcase, Building, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export interface SavedAddress {
  id: string;
  label: string; // "Home", "Office", "Apartment", "Other"
  street: string;
  area: string; // e.g. "Gulberg III", "DHA Phase 5", "Cantt", "Johar Town"
  isDefault?: boolean;
}

const LAHORE_AREAS = [
  "Gulberg III (Main Blvd / MM Alam)",
  "DHA Phase 1-6 & Phase 8",
  "Lahore Cantt / Mall Road",
  "Model Town / Garden Town",
  "Johar Town / Faisal Town",
  "Bahria Town Lahore",
  "WAPDA Town & PCSIR",
  "Gulshan-e-Ravi / Samanabad",
];

interface SavedAddressesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAddress?: (addressText: string) => void;
}

export const SavedAddressesDialog = ({
  open,
  onOpenChange,
  onSelectAddress,
}: SavedAddressesDialogProps) => {
  const { user, updateUserProfile } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState<"Home" | "Office" | "Other">("Home");
  const [newStreet, setNewStreet] = useState("");
  const [newArea, setNewArea] = useState(LAHORE_AREAS[0]);
  const [isSaving, setIsSaving] = useState(false);

  // Load addresses from local storage key or user profile
  useEffect(() => {
    if (!open) return;
    const storageKey = `grillspot_addresses_${user?.uid || "guest"}`;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setAddresses(JSON.parse(stored));
      } else if (user?.address) {
        const initialList: SavedAddress[] = [
          {
            id: "addr-1",
            label: "Home",
            street: user.address,
            area: "Gulberg III (Main Blvd / MM Alam)",
            isDefault: true,
          },
        ];
        setAddresses(initialList);
        localStorage.setItem(storageKey, JSON.stringify(initialList));
      } else {
        setAddresses([]);
      }
    } catch {
      setAddresses([]);
    }
  }, [open, user]);

  const saveAddressList = (list: SavedAddress[]) => {
    setAddresses(list);
    const storageKey = `grillspot_addresses_${user?.uid || "guest"}`;
    localStorage.setItem(storageKey, JSON.stringify(list));
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet.trim()) {
      toast.error("Please enter a street address or house number");
      return;
    }

    setIsSaving(true);
    const fullText = `${newStreet.trim()}, ${newArea}, Lahore`;
    const isFirst = addresses.length === 0;

    const newEntry: SavedAddress = {
      id: `addr-${Date.now()}`,
      label: newLabel,
      street: newStreet.trim(),
      area: newArea,
      isDefault: isFirst,
    };

    const updated = [...addresses, newEntry];
    saveAddressList(updated);

    // If it's default or the user has no address set yet, update main profile
    if (isFirst || newEntry.isDefault) {
      if (user) {
        await updateUserProfile({ address: fullText });
      }
    }

    setIsSaving(false);
    setIsAddingNew(false);
    setNewStreet("");
    toast.success("Delivery address saved!");
  };

  const handleSetDefault = async (id: string) => {
    const target = addresses.find((a) => a.id === id);
    if (!target) return;

    const updated = addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    saveAddressList(updated);

    const fullText = `${target.street}, ${target.area}, Lahore`;
    if (user) {
      await updateUserProfile({ address: fullText });
    }
    toast.success(`"${target.label}" set as primary delivery address`);
  };

  const handleDelete = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    if (updated.length > 0 && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true;
    }
    saveAddressList(updated);
    toast.success("Address removed");
  };

  const handleSelect = (addr: SavedAddress) => {
    const fullText = `${addr.street}, ${addr.area}, Lahore`;
    if (onSelectAddress) {
      onSelectAddress(fullText);
    }
    toast.info(`Selected ${addr.label}: ${fullText}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto bg-card border-border p-6">
        <DialogHeader className="space-y-1.5 text-left pb-2 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <MapPin className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-semibold">
              Delivery Addresses
            </span>
          </div>
          <DialogTitle className="text-xl font-light tracking-tight">
            Saved Delivery Locations
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-light">
            Manage your saved homes, offices, and delivery spots across Lahore.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-3">
          {/* Add New Address Toggle / Button */}
          {!isAddingNew ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNew(true)}
              className="w-full rounded-lg border-dashed border-primary/40 text-primary hover:bg-primary/5 text-xs py-5 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Lahore Delivery Address
            </Button>
          ) : (
            <form onSubmit={handleAddNew} className="p-4 rounded-xl bg-accent/40 border border-border space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-medium text-foreground">
                  New Address
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
              </div>

              {/* Label Selector */}
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5 block">
                  Location Type
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Home", "Office", "Other"] as const).map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setNewLabel(lbl)}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg border text-xs transition-all ${
                        newLabel === lbl
                          ? "bg-primary text-primary-foreground border-primary font-medium"
                          : "bg-background border-border text-foreground hover:bg-accent"
                      }`}
                    >
                      {lbl === "Home" && <Home className="w-3.5 h-3.5" />}
                      {lbl === "Office" && <Briefcase className="w-3.5 h-3.5" />}
                      {lbl === "Other" && <Building className="w-3.5 h-3.5" />}
                      <span>{lbl}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Area */}
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">
                  Lahore Area / Sector
                </Label>
                <select
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {LAHORE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </div>

              {/* Street Address */}
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">
                  Street Address / House / Flat Number
                </Label>
                <Input
                  value={newStreet}
                  onChange={(e) => setNewStreet(e.target.value)}
                  placeholder="e.g. House 24, Block G, Street 5"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  size="sm"
                  className="bg-primary text-primary-foreground text-xs"
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
                  Save Address
                </Button>
              </div>
            </form>
          )}

          {/* List of Saved Addresses */}
          <div className="space-y-2.5">
            {addresses.length === 0 ? (
              <div className="text-center py-8 px-4 border border-dashed border-border rounded-xl bg-card">
                <MapPin className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                <p className="text-xs font-medium text-foreground">No saved addresses yet</p>
                <p className="text-[11px] text-muted-foreground font-light max-w-xs mx-auto mt-1">
                  Add your home or office address in Lahore for fast 1-click checkout.
                </p>
              </div>
            ) : (
              addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    addr.isDefault
                      ? "bg-primary/5 border-primary/40 shadow-xs"
                      : "bg-card border-border hover:border-border/80"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-accent text-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                        {addr.label === "Home" && <Home className="w-4 h-4 text-primary" />}
                        {addr.label === "Office" && <Briefcase className="w-4 h-4 text-primary" />}
                        {addr.label === "Other" && <Building className="w-4 h-4 text-primary" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">
                            {addr.label}
                          </span>
                          {addr.isDefault && (
                            <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 bg-primary text-primary-foreground rounded-full font-medium">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground/90 font-light mt-0.5 line-clamp-1">
                          {addr.street}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-light">
                          {addr.area}, Lahore
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-[10px] text-primary hover:underline px-1.5 py-1"
                        >
                          Set Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDelete(addr.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-destructive/10"
                        aria-label="Delete address"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {onSelectAddress && (
                    <div className="mt-2.5 pt-2 border-t border-border/60 flex justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="h-7 text-[10px] uppercase tracking-wider rounded-md"
                        onClick={() => handleSelect(addr)}
                      >
                        Use for this Order
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
