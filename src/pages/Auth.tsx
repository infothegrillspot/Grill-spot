import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Flame, 
  ArrowLeft, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Sparkles, 
  LogOut, 
  ShieldCheck, 
  Check, 
  ShoppingBag, 
  Utensils, 
  Calendar,
  Database,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { fetchD1Orders, fetchD1Bookings, D1Order, D1Booking } from "@/lib/d1Api";

const Auth = () => {
  const { user, loading, signInWithGoogle, signOut, updateUserProfile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "bookings">("profile");

  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [favoriteBranch, setFavoriteBranch] = useState("Gulberg III");
  const [dietaryPreferences, setDietaryPreferences] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // User History from Cloudflare D1
  const [userOrders, setUserOrders] = useState<D1Order[]>([]);
  const [userBookings, setUserBookings] = useState<D1Booking[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
      setPhotoURL(user.photoURL || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setFavoriteBranch(user.favoriteBranch || "Gulberg III");
      setDietaryPreferences(user.dietaryPreferences || "");

      // Fetch user's orders and reservations from Cloudflare D1
      setIsLoadingHistory(true);
      Promise.all([
        fetchD1Orders(user.uid),
        fetchD1Bookings(user.uid),
      ])
        .then(([orders, bookings]) => {
          setUserOrders(orders);
          setUserBookings(bookings);
        })
        .catch((e) => console.warn("Failed to fetch D1 user history:", e))
        .finally(() => setIsLoadingHistory(false));
    }
  }, [user]);

  const handleGoogleAuth = async () => {
    const loggedUser = await signInWithGoogle();
    if (loggedUser && loggedUser.role === "admin") {
      navigate("/admin");
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSaving(true);
    await updateUserProfile({
      displayName: displayName.trim(),
      photoURL: photoURL.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      favoriteBranch,
      dietaryPreferences: dietaryPreferences.trim() || null,
    });
    setIsSaving(false);
  };

  if (user) {
    return (
      <div className="min-h-screen bg-foreground flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl bg-card text-card-foreground rounded-2xl p-6 md:p-8 shadow-2xl border border-border"
        >
          {/* Top User Card Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || "User"}
                  className="w-12 h-12 rounded-full object-cover border border-primary/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center text-lg font-bold">
                  {(user.displayName || user.email || "G")[0].toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-base md:text-lg font-medium text-foreground flex items-center gap-2">
                  <span>{user.displayName || "Member Profile"}</span>
                  {isAdmin && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      <ShieldCheck className="w-3 h-3" /> Admin
                    </span>
                  )}
                </h1>
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{user.email}</span>
                  <span>•</span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Database className="w-2.5 h-2.5" /> D1 SQL Synced
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut()}
              className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-destructive/10"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-muted/60 p-1 rounded-lg border border-border mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-normal transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "profile" ? "bg-card text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Profile Details
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-normal transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "orders" ? "bg-card text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Orders History ({userOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bookings")}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-normal transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "bookings" ? "bg-card text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Reservations ({userBookings.length})
            </button>
          </div>

          {/* TAB 1: Profile Form */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="auth-name" className="text-xs text-foreground/80 flex items-center gap-1.5 font-normal">
                  <User className="w-3.5 h-3.5 text-muted-foreground" /> Full Name
                </Label>
                <Input
                  id="auth-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Hamza Malik"
                  className="h-9 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="auth-phone" className="text-xs text-foreground/80 flex items-center gap-1.5 font-normal">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone Number (Pakistan)
                  </Label>
                  <Input
                    id="auth-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 1234567"
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground/80 flex items-center gap-1.5 font-normal">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Favorite Branch
                  </Label>
                  <Select value={favoriteBranch} onValueChange={setFavoriteBranch}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Gulberg III">Gulberg III</SelectItem>
                      <SelectItem value="DHA Phase 5">DHA Phase 5</SelectItem>
                      <SelectItem value="Mall Road / Cantt">Mall Road & Cantt</SelectItem>
                      <SelectItem value="Bahria Town">Bahria Town</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auth-address" className="text-xs text-foreground/80 flex items-center gap-1.5 font-normal">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Delivery Street Address (Lahore)
                </Label>
                <Input
                  id="auth-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. House 14, Block C, Model Town, Lahore"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auth-photo" className="text-xs text-foreground/80 flex items-center gap-1.5 font-normal">
                  <Sparkles className="w-3.5 h-3.5 text-muted-foreground" /> Custom Avatar URL (Optional)
                </Label>
                <Input
                  id="auth-photo"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://..."
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="auth-diet" className="text-xs text-foreground/80 font-normal">
                  Grill & Spice Preferences
                </Label>
                <Textarea
                  id="auth-diet"
                  value={dietaryPreferences}
                  onChange={(e) => setDietaryPreferences(e.target.value)}
                  placeholder="e.g. Mild spice, boneless cuts preferred, allergy to nuts..."
                  className="text-xs resize-none min-h-[60px]"
                />
              </div>

              <div className="pt-3 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="text-xs font-normal"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Home
                </Button>

                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/admin")}
                      className="text-xs font-normal border-primary/30 text-primary"
                    >
                      Admin Dashboard
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isSaving}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-normal"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                        Save to D1 SQL
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: Orders History (D1 SQL) */}
          {activeTab === "orders" && (
            <div className="space-y-3">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                  Loading order history from Cloudflare D1...
                </div>
              ) : userOrders.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground mx-auto stroke-1" />
                  <p className="text-xs font-medium text-foreground">No orders in Cloudflare D1 yet</p>
                  <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                    Place an order for burgers or grill platters and they will appear here in your D1 SQLite history.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {userOrders.map((order) => (
                    <Card key={order.id} className="p-4 border border-border bg-card/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-foreground">Order #{order.id.slice(-6)}</span>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] uppercase font-normal">{order.status}</Badge>
                          <Badge variant="secondary" className="text-[10px] uppercase font-normal">{order.orderType}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground font-light mb-2">
                        {Array.isArray(order.items) ? order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ") : "Grill items"}
                      </p>
                      <div className="flex items-center justify-between text-xs pt-2 border-t border-border/50">
                        <span className="text-muted-foreground text-[11px]">{order.createdAt || "Recent"}</span>
                        <span className="font-medium text-primary">Rs. {Number(order.grandTotal).toLocaleString()}</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="pt-2 flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="text-xs font-normal"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Home
                </Button>
              </div>
            </div>
          )}

          {/* TAB 3: Reservations History (D1 SQL) */}
          {activeTab === "bookings" && (
            <div className="space-y-3">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                  Loading reservations from Cloudflare D1...
                </div>
              ) : userBookings.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Utensils className="w-8 h-8 text-muted-foreground mx-auto stroke-1" />
                  <p className="text-xs font-medium text-foreground">No table reservations yet</p>
                  <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                    Reserve a spot by the grill and your reservation details will be tracked here in Cloudflare D1.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {userBookings.map((b) => (
                    <Card key={b.id} className="p-4 border border-border bg-card/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-medium text-foreground">{b.area || "Lahore Grill Branch"}</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase font-normal">{b.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-light mb-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {b.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.time || "7:00 PM"}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {b.guests} Guests</span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="pt-2 flex justify-start">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="text-xs font-normal"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to Home
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-foreground flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Flame className="h-5 w-5 text-primary" />
            <span className="text-sm font-normal tracking-wide text-background">
              The Grill Spot
            </span>
          </div>
          <h1 className="text-2xl font-light text-background mb-2 tracking-tight">
            Sign In / Sign Up
          </h1>
          <p className="text-xs text-background/60 font-light">
            Continue with your Google account to edit your profile, track food orders, and manage table bookings backed by Cloudflare D1 SQL
          </p>
        </div>

        <div className="space-y-4">
          <Button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full h-12 rounded-full text-xs font-normal bg-background text-foreground hover:bg-background/90 flex items-center justify-center gap-3 transition-all shadow-md"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-foreground" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Continue with Google</span>
          </Button>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-background/15" />
            </div>
            <span className="relative bg-foreground px-3 text-[10px] uppercase tracking-wider text-background/40 font-light">
              or quick preview
            </span>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate("/admin?demo=true")}
            className="w-full h-10 rounded-full text-[11px] uppercase tracking-wider font-normal bg-background/10 text-background border-background/20 hover:bg-background/20 hover:text-background"
          >
            Enter Demo Mode
          </Button>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-xs text-background/40 hover:text-background/60 font-light transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="h-3 w-3" />
            Back to site
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
