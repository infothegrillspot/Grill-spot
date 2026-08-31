import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Flame,
  ShoppingBag,
  UserPlus,
  User,
  Settings,
  LogOut,
  ShieldCheck,
  Search,
  Bike,
  Store,
  ArrowRight,
  Plus,
  Check,
  MapPin,
  Clock,
  PackageCheck,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { EditProfileDialog } from "./EditProfileDialog";
import { SavedAddressesDialog } from "./SavedAddressesDialog";
import { OrderHistoryDialog } from "./OrderHistoryDialog";
import { locations } from "@/data/locations";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface NavigationProps {
  variant?: "default" | "dark";
}

const Navigation = ({
  variant = "default"
}: NavigationProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAddressesOpen, setIsAddressesOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const {
    totalItems,
    setIsCartOpen,
    addToCart,
    orderType,
    setOrderType,
    searchQuery,
    setSearchQuery,
  } = useCart();
  const { user, signOut, isAdmin } = useAuth();
  const isDark = variant === "dark";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle click outside to close live search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [{
    label: "Menu",
    href: "/locations",
    isRoute: true
  }];

  const textColorClass = isDark || !isScrolled ? "text-white" : "text-foreground";
  const hoverTextClass = "hover:opacity-75 transition-opacity";

  // Filtered menu items for the search bar
  const searchResults = searchQuery.trim()
    ? locations.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.features.some((f) =>
            f.toLowerCase().includes(searchQuery.toLowerCase())
          ) ||
          item.details.some((d) =>
            d.toLowerCase().includes(searchQuery.toLowerCase())
          )
      )
    : [];

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      setIsMobileMenuOpen(false);
      navigate(`/locations?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/locations");
    }
  };

  const handleSelectDeliveryMode = (mode: "delivery" | "takeaway") => {
    setOrderType(mode);
    toast.success(
      mode === "delivery"
        ? "Delivery selected • 30-45 mins (Lahore)"
        : "Pickup selected • Pick up at MM Alam Road Branch"
    );
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-400 ${
          isMobileMenuOpen
            ? "bg-foreground"
            : isDark
            ? isScrolled
              ? "bg-foreground/95 backdrop-blur-lg shadow-soft"
              : "bg-foreground"
            : isScrolled
            ? "bg-card/95 backdrop-blur-lg shadow-soft"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-10 py-3 md:py-3.5">
          <div className="flex items-center justify-between gap-3 lg:gap-6">
            {/* Left Brand and Delivery/Pickup Option */}
            <div className="flex items-center gap-4 lg:gap-6">
              <Link to="/">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Flame
                    className={`h-5 w-5 ${
                      isMobileMenuOpen || isDark || !isScrolled
                        ? "text-white"
                        : "text-primary"
                    }`}
                  />
                  <div className="flex flex-col">
                    <span
                      className={`text-sm font-medium tracking-wide leading-none ${
                        isMobileMenuOpen || isDark || !isScrolled
                          ? "text-white"
                          : "text-foreground"
                      }`}
                    >
                      The Grill Spot
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-primary font-semibold mt-0.5">
                      Lahore
                    </span>
                  </div>
                </motion.div>
              </Link>

              {/* Delivery / Pickup Segmented Control (Desktop) */}
              <div
                className={`hidden md:flex items-center p-0.5 rounded-full border text-[11px] font-medium backdrop-blur-md transition-all ${
                  isDark || !isScrolled
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-muted/80 border-border text-foreground"
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectDeliveryMode("delivery")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                    orderType === "delivery"
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : isDark || !isScrolled
                      ? "text-white/80 hover:text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bike className="w-3.5 h-3.5" />
                  <span>Delivery</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDeliveryMode("takeaway")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                    orderType === "takeaway"
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : isDark || !isScrolled
                      ? "text-white/80 hover:text-white"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Pickup</span>
                </button>
              </div>
            </div>

            {/* Center: Search Bar */}
            <div
              ref={searchContainerRef}
              className="relative hidden sm:block flex-1 max-w-xs md:max-w-sm lg:max-w-md"
            >
              <form onSubmit={handleSearchSubmit} className="relative w-full">
                <Search
                  className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors ${
                    isDark || !isScrolled
                      ? "text-white/70"
                      : "text-muted-foreground"
                  }`}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search burgers, shawarma, platters..."
                  className={`w-full h-9 pl-9 pr-8 text-xs rounded-full border transition-all duration-200 outline-none backdrop-blur-md ${
                    isDark || !isScrolled
                      ? "bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 focus:border-white/40 focus:ring-1 focus:ring-white/40"
                      : "bg-muted/70 border-border text-foreground placeholder:text-muted-foreground focus:bg-card focus:border-primary/50 focus:ring-1 focus:ring-primary/40"
                  }`}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setIsSearchFocused(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </form>

              {/* Live Search Results Dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchQuery.trim().length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 right-0 top-full mt-2 bg-card border border-border rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-border"
                  >
                    <div className="p-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium bg-muted/30 flex items-center justify-between">
                      <span>Matching Dishes ({searchResults.length})</span>
                      <button
                        type="button"
                        onClick={handleSearchSubmit}
                        className="text-primary hover:underline text-[10px] lowercase flex items-center gap-1"
                      >
                        view all in menu <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {searchResults.length > 0 ? (
                      <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
                        {searchResults.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 flex items-center justify-between gap-3 hover:bg-accent/50 transition-colors group"
                          >
                            <Link
                              to={`/location/${item.id}`}
                              onClick={() => setIsSearchFocused(false)}
                              className="flex items-center gap-2.5 flex-1 min-w-0"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                  {item.name}
                                </p>
                                <p className="text-[11px] text-muted-foreground font-light">
                                  Rs. {item.price.toLocaleString()}
                                </p>
                              </div>
                            </Link>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10px] uppercase tracking-wider px-2.5 rounded-full flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart({
                                  id: item.id,
                                  name: item.name,
                                  price: item.price,
                                  image: item.image,
                                  notes: item.features.slice(0, 2).join(", "),
                                });
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-xs text-muted-foreground font-light">
                          No grill items found matching "{searchQuery}"
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => {
                            setSearchQuery("");
                            setIsSearchFocused(false);
                            navigate("/locations");
                          }}
                          className="mt-1 text-xs text-primary font-normal"
                        >
                          Browse Full Menu
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Action Cluster: Menu Link, Cart, Auth/Profile */}
            <div className="flex items-center gap-3 lg:gap-4">
              <div className="hidden md:flex items-center gap-6">
                {navItems.map((item) =>
                  item.isRoute ? (
                    <Link
                      key={item.label}
                      to={item.href}
                      className={`text-[11px] uppercase tracking-wider font-normal ${textColorClass} ${hoverTextClass}`}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      className={`text-[11px] uppercase tracking-wider font-normal ${textColorClass} ${hoverTextClass}`}
                    >
                      {item.label}
                    </a>
                  )
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Cart Button with Counter */}
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-normal backdrop-blur-md border transition-all ${
                    isDark || !isScrolled
                      ? "bg-white/10 text-white border-white/20 hover:bg-white/20"
                      : "bg-black/5 text-foreground border-border hover:bg-black/10"
                  }`}
                  aria-label="View Shopping Cart"
                >
                  <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden sm:inline">Cart</span>
                  {totalItems > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">
                      {totalItems}
                    </span>
                  )}
                </button>

                {/* User Profile or Sign Up Button */}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-normal backdrop-blur-md border transition-all ${
                          isDark || !isScrolled
                            ? "bg-white/15 text-white border-white/30 hover:bg-white/25"
                            : "bg-accent/80 text-foreground border-border hover:bg-accent"
                        }`}
                      >
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={user.displayName || "User"}
                            className="w-5 h-5 rounded-full object-cover border border-white/40"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                            {(user.displayName || user.email || "G")[0].toUpperCase()}
                          </div>
                        )}
                        <span className="max-w-[75px] truncate text-xs hidden sm:inline">
                          {user.displayName?.split(" ")[0] || "Profile"}
                        </span>
                        {isAdmin && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent
                      align="end"
                      className="w-56 bg-card border-border p-1.5 shadow-xl"
                    >
                      <DropdownMenuLabel className="font-normal px-2 py-1.5">
                        <div className="flex flex-col space-y-0.5">
                          <p className="text-xs font-medium text-foreground truncate">
                            {user.displayName || "Valued Member"}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border" />

                      <DropdownMenuItem
                        onClick={() => setIsAddressesOpen(true)}
                        className="text-xs cursor-pointer focus:bg-accent px-2 py-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5 mr-2 text-primary" />
                        Saved Addresses
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setIsOrdersOpen(true)}
                        className="text-xs cursor-pointer focus:bg-accent px-2 py-1.5"
                      >
                        <Clock className="w-3.5 h-3.5 mr-2 text-primary" />
                        Order History
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => setIsProfileOpen(true)}
                        className="text-xs cursor-pointer focus:bg-accent px-2 py-1.5"
                      >
                        <Settings className="w-3.5 h-3.5 mr-2 text-primary" />
                        Edit Profile
                      </DropdownMenuItem>

                      {isAdmin && (
                        <DropdownMenuItem
                          onClick={() => navigate("/admin")}
                          className="text-xs cursor-pointer focus:bg-accent px-2 py-1.5 text-primary"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 mr-2" />
                          Admin Dashboard
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator className="bg-border" />
                      <DropdownMenuItem
                        onClick={() => signOut()}
                        className="text-xs cursor-pointer focus:bg-destructive/10 text-destructive px-2 py-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link to="/auth" className="hidden md:inline-block">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`rounded-full text-[11px] uppercase tracking-wider font-normal px-3.5 h-8 ${
                        isDark || !isScrolled
                          ? "text-white hover:bg-white/15 hover:text-white"
                          : "text-foreground hover:bg-black/5 hover:text-foreground"
                      }`}
                    >
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                      Sign Up
                    </Button>
                  </Link>
                )}

                {/* Mobile Menu Trigger */}
                <button
                  className={`p-1.5 md:hidden ${
                    isMobileMenuOpen || isDark || !isScrolled
                      ? "text-white"
                      : "text-foreground"
                  }`}
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  aria-label="Toggle Menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Slide-Down Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
                animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
                exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className={`md:hidden mt-4 pb-4 -mx-4 px-4 rounded-b-xl border-t border-white/10 ${
                  isDark || !isScrolled ? "bg-foreground" : "bg-card"
                }`}
              >
                {/* Mobile Delivery / Pickup Toggle */}
                <div className="flex items-center gap-2 my-3 p-1 rounded-full bg-white/10 border border-white/15">
                  <button
                    type="button"
                    onClick={() => handleSelectDeliveryMode("delivery")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      orderType === "delivery"
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-white/80"
                    }`}
                  >
                    <Bike className="w-3.5 h-3.5" />
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDeliveryMode("takeaway")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      orderType === "takeaway"
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-white/80"
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    Pickup
                  </button>
                </div>

                {/* Mobile Search Bar */}
                <form onSubmit={handleSearchSubmit} className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu items..."
                    className="w-full h-9 pl-9 pr-4 text-xs rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 outline-none focus:bg-white/20"
                  />
                </form>

                {navItems.map((item) =>
                  item.isRoute ? (
                    <Link
                      key={item.label}
                      to={item.href}
                      className="block py-2.5 text-xs uppercase tracking-wider font-normal text-white hover:opacity-80"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a
                      key={item.label}
                      href={item.href}
                      className="block py-2.5 text-xs uppercase tracking-wider font-normal text-white hover:opacity-80"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </a>
                  )
                )}

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsCartOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-full text-[11px] uppercase tracking-wider font-normal bg-white/10 text-white border border-white/20"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Cart ({totalItems})
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsOrdersOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] uppercase tracking-wider font-normal bg-white/10 text-white border border-white/20"
                  >
                    <Clock className="h-3.5 w-3.5" />
                    Orders
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsAddressesOpen(true);
                    }}
                    className="flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] uppercase tracking-wider font-normal bg-white/10 text-white border border-white/20"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Addresses
                  </button>

                  {user ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setIsProfileOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] uppercase tracking-wider font-normal bg-white/15 text-white border border-white/30"
                    >
                      <User className="h-3.5 w-3.5" />
                      Profile
                    </button>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] uppercase tracking-wider font-normal bg-white/10 text-white border border-white/20"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Sign Up
                    </Link>
                  )}
                </div>

                {user && isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full mt-2 text-center py-2 rounded-full text-[11px] uppercase tracking-wider text-primary bg-primary/10 border border-primary/20"
                  >
                    Admin Dashboard
                  </Link>
                )}

                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full mt-2 text-center py-2 text-[11px] uppercase tracking-wider text-destructive hover:underline"
                  >
                    Sign Out
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Member Dialog Modals */}
      <EditProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
      <SavedAddressesDialog open={isAddressesOpen} onOpenChange={setIsAddressesOpen} />
      <OrderHistoryDialog open={isOrdersOpen} onOpenChange={setIsOrdersOpen} />
    </>
  );
};

export default Navigation;

