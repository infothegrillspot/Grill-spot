import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Flame, ShoppingBag, UserPlus, User, Settings, LogOut, ShieldCheck } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { EditProfileDialog } from "./EditProfileDialog";
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
  const { totalItems, setIsCartOpen } = useCart();
  const { user, signOut, isAdmin } = useAuth();
  const isDark = variant === "dark";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";

  const handleBookNow = () => {
    if (isHomePage) {
      document.getElementById('booking')?.scrollIntoView({
        behavior: 'smooth'
      });
    } else {
      navigate('/');
      setTimeout(() => {
        document.getElementById('booking')?.scrollIntoView({
          behavior: 'smooth'
        });
      }, 100);
    }
  };

  const navItems = [{
    label: "Menu",
    href: "/locations",
    isRoute: true
  }, {
    label: "About",
    href: "/about",
    isRoute: true
  }, {
    label: "Contact",
    href: "/contact",
    isRoute: true
  }];

  const textColorClass = isDark || !isScrolled ? "text-white" : "text-foreground";
  const hoverTextClass = "hover:opacity-75 transition-opacity";

  return (
    <>
      <motion.nav initial={{
        y: -100
      }} animate={{
        y: 0
      }} transition={{
        duration: 0.6
      }} className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-400 ${isMobileMenuOpen ? "bg-foreground" : isDark ? isScrolled ? "bg-foreground/95 backdrop-blur-lg shadow-soft" : "bg-foreground" : isScrolled ? "bg-card/95 backdrop-blur-lg shadow-soft" : "bg-transparent"}`}>
        <div className="container mx-auto px-6 lg:px-12 py-4 md:py-5">
          <div className="flex items-center justify-between">
            <Link to="/">
              <motion.div whileHover={{
              scale: 1.02
            }} className="flex items-center gap-2 cursor-pointer">
                <Flame className={`h-4 w-4 ${isMobileMenuOpen || isDark || !isScrolled ? "text-white" : "text-primary"}`} />
                <span className={`text-sm font-normal tracking-wide ${isMobileMenuOpen || isDark || !isScrolled ? "text-white" : "text-foreground"}`}>
                  The Grill Spot
                </span>
              </motion.div>
            </Link>

            <div className="hidden md:flex items-center gap-8 lg:gap-10">
              <div className="flex items-center gap-7 lg:gap-8">
                {navItems.map(item => item.isRoute ? <Link key={item.label} to={item.href} className={`text-[11px] uppercase tracking-wider font-normal ${textColorClass} ${hoverTextClass}`}>
                      {item.label}
                    </Link> : <a key={item.label} href={item.href} className={`text-[11px] uppercase tracking-wider font-normal ${textColorClass} ${hoverTextClass}`}>
                      {item.label}
                    </a>)}
              </div>

              {/* Right Action Cluster: Cart, Auth/Profile, and Reserve a Table */}
              <div className="flex items-center gap-2 lg:gap-2.5">
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
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Cart</span>
                  {totalItems > 0 && (
                    <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
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
                        <span className="max-w-[85px] truncate text-xs">
                          {user.displayName?.split(" ")[0] || "Profile"}
                        </span>
                        {isAdmin && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end" className="w-56 bg-card border-border p-1.5 shadow-xl">
                      <DropdownMenuLabel className="font-normal px-2 py-1.5">
                        <div className="flex flex-col space-y-0.5">
                          <p className="text-xs font-medium text-foreground truncate">{user.displayName || "Valued Member"}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border" />

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
                  <Link to="/auth">
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

                {/* Reserve a Table Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className={`rounded-full smooth-hover text-[11px] uppercase tracking-wider font-normal backdrop-blur-md border border-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] px-4 lg:px-5 h-8 ${
                    isDark || !isScrolled
                      ? "bg-white/10 text-white hover:bg-primary/80 hover:text-white hover:border-primary/80"
                      : "bg-white/20 text-foreground hover:bg-primary/80 hover:text-white hover:border-primary/80"
                  }`}
                  onClick={handleBookNow}
                >
                  Reserve a Table
                </Button>
              </div>
            </div>

            {/* Mobile Right Controls */}
            <div className="flex md:hidden items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2 rounded-full ${isMobileMenuOpen || isDark || !isScrolled ? "text-white bg-white/10" : "text-foreground bg-black/5"}`}
                aria-label="Open Cart"
              >
                <ShoppingBag className="h-4 w-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                className={`p-1.5 ${isMobileMenuOpen || isDark || !isScrolled ? "text-white" : "text-foreground"}`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

        <AnimatePresence>
        {isMobileMenuOpen && <motion.div initial={{
          opacity: 0,
          clipPath: "inset(0 0 100% 0)"
        }} animate={{
          opacity: 1,
          clipPath: "inset(0 0 0% 0)"
        }} exit={{
          opacity: 0,
          clipPath: "inset(0 0 100% 0)"
        }} transition={{
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1]
        }} className={`md:hidden mt-6 pb-4 -mx-6 px-6 rounded-b-xl ${isDark || !isScrolled ? "bg-foreground" : "bg-card"}`}>
              {navItems.map(item => item.isRoute ? <Link key={item.label} to={item.href} className={`block py-3 text-[11px] uppercase tracking-wider font-normal smooth-hover hover:opacity-60 ${isDark || !isScrolled ? "text-white" : "text-foreground"}`} onClick={() => setIsMobileMenuOpen(false)}>
                    {item.label}
                  </Link> : <a key={item.label} href={item.href} className={`block py-3 text-[11px] uppercase tracking-wider font-normal smooth-hover hover:opacity-60 ${isDark || !isScrolled ? "text-white" : "text-foreground"}`} onClick={() => setIsMobileMenuOpen(false)}>
                    {item.label}
                  </a>)}
              
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsCartOpen(true);
                  }}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-full text-[11px] uppercase tracking-wider font-normal border ${
                    isDark || !isScrolled
                      ? "bg-white/10 text-white border-white/20"
                      : "bg-black/5 text-foreground border-border"
                  }`}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Cart ({totalItems})
                </button>

                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsProfileOpen(true);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] uppercase tracking-wider font-normal border ${
                      isDark || !isScrolled
                        ? "bg-white/15 text-white border-white/30"
                        : "bg-accent text-foreground border-border"
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    Edit Profile
                  </button>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[11px] uppercase tracking-wider font-normal border ${
                      isDark || !isScrolled
                        ? "bg-white/10 text-white border-white/20"
                        : "bg-black/5 text-foreground border-border"
                    }`}
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

              <Button variant="outline" className={`w-full mt-3 rounded-full text-[11px] uppercase tracking-wider font-normal backdrop-blur-md border border-white/30 shadow-[0_4px_30px_rgba(0,0,0,0.1)] px-5 ${isDark || !isScrolled ? "bg-white/10 text-white hover:bg-primary/80 hover:text-white hover:border-primary/80" : "bg-white/20 text-foreground hover:bg-primary/80 hover:text-white hover:border-primary/80"}`} onClick={() => {
            setIsMobileMenuOpen(false);
            handleBookNow();
          }}>
                Reserve a Table
              </Button>
            </motion.div>}
        </AnimatePresence>
        </div>
      </motion.nav>

      {/* Edit Profile Dialog Modal */}
      <EditProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </>
  );
};
export default Navigation;
