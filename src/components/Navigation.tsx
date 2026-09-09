import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Flame,
  Search,
  Bike,
  Store,
  ArrowRight,
  Plus,
  Check,
  MapPin,
  Clock,
  Calendar,
} from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/context/CartContext";
import { locations } from "@/data/locations";
import { toast } from "sonner";

interface NavigationProps {
  variant?: "default" | "dark";
  onOpenAdmin?: () => void;
  onOpenAuth?: () => void;
  onSelectDish?: (dishId: string) => void;
}

const Navigation = ({
  variant = "default",
  onSelectDish,
}: NavigationProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const {
    addToCart,
    orderType,
    setOrderType,
    searchQuery,
    setSearchQuery,
  } = useCart();
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

  const navLinks = [
    { label: "Menu", targetId: "menu" },
    { label: "Our Story", targetId: "about" },
    { label: "Contact", targetId: "contact" },
  ];

  const scrollToSection = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

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
    setIsSearchFocused(false);
    scrollToSection("menu");
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
        className={`fixed top-0 left-0 right-0 z-30 transition-all duration-400 ${
          isDark
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
            {/* Left: Brand Logo */}
            <div className="flex items-center flex-1 justify-start min-w-0">
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="flex items-center gap-2 cursor-pointer text-left flex-shrink-0"
              >
                <Flame
                  className={`h-5 w-5 ${
                    isDark || !isScrolled
                      ? "text-white"
                      : "text-primary"
                  }`}
                />
                <div className="flex flex-col">
                  <span
                    className={`text-sm font-medium tracking-wide leading-none ${
                      isDark || !isScrolled
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
              </button>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-initial w-full max-w-xs md:max-w-sm lg:max-w-md flex justify-center mx-2">
              <div
                ref={searchContainerRef}
                className="relative hidden sm:block w-full"
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
                        view in menu <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    {searchResults.length > 0 ? (
                      <div className="max-h-72 overflow-y-auto divide-y divide-border/60">
                        {searchResults.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 flex items-center justify-between gap-3 hover:bg-accent/50 transition-colors group"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setIsSearchFocused(false);
                                if (onSelectDish) onSelectDish(item.id);
                              }}
                              className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
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
                            </button>
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
                            scrollToSection("menu");
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
          </div>

            {/* Right Action Cluster: Delivery/Pickup Toggle & Section Links */}
            <div className="flex items-center gap-3 lg:gap-5 flex-1 justify-end min-w-0">
              {/* Delivery / Pickup Segmented Control (Desktop) */}
              <div
                className={`hidden md:flex items-center p-0.5 rounded-full border text-[11px] font-medium backdrop-blur-md transition-all flex-shrink-0 ${
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

              <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
                {navLinks.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => scrollToSection(item.targetId)}
                    className={`text-[11px] uppercase tracking-wider font-normal cursor-pointer ${textColorClass} ${hoverTextClass}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.nav>
    </>
  );
};

export default Navigation;
