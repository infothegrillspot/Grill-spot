import { useState, useMemo, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UtensilsCrossed, Star, ArrowRight, ArrowUpDown, Search, X, ShoppingBag } from "lucide-react";
import bannerImage from "@/assets/hero-grill.jpg";
import { locations } from "@/data/locations";
import { useCart } from "@/context/CartContext";

type SortOption = "price-low" | "price-high" | "rating";

const Locations = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);
  const [sortBy, setSortBy] = useState<SortOption>("price-low");
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchQuery, setSearchQuery, addToCart, setIsCartOpen } = useCart();

  const urlQuery = searchParams.get("q") || "";

  useEffect(() => {
    if (urlQuery && urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery, searchQuery, setSearchQuery]);

  const activeQuery = searchQuery.trim().toLowerCase();

  const sortedLocations = useMemo(() => {
    let filtered = [...locations];

    if (activeQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(activeQuery) ||
          item.description.toLowerCase().includes(activeQuery) ||
          item.features.some((f) => f.toLowerCase().includes(activeQuery)) ||
          item.details.some((d) => d.toLowerCase().includes(activeQuery))
      );
    }

    switch (sortBy) {
      case "price-low":
        return filtered.sort((a, b) => a.price - b.price);
      case "price-high":
        return filtered.sort((a, b) => b.price - a.price);
      case "rating":
        return filtered.sort((a, b) => b.rating - a.rating);
      default:
        return filtered;
    }
  }, [sortBy, activeQuery]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />

      {/* Hero Image with Parallax */}
      <div className="relative w-full h-[40vh] md:h-[48vh] overflow-hidden">
        <motion.img
          src={bannerImage}
          alt="Locations banner"
          style={{ y }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 w-full h-[120%] object-cover"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <div className="text-center px-4 max-w-xl">
            <span className="text-[11px] uppercase tracking-widest text-white/80 mb-2 block font-medium">
              The Grill Spot • Lahore
            </span>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-white mb-2">
              Everything Off The Grill
            </h1>
            <p className="text-xs md:text-sm text-white/80 font-light">
              Freshly grilled smashed burgers, shawarma, wood-fired pizza & BBQ
            </p>
          </div>
        </div>
      </div>

      <main className="py-16 lg:py-24 px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-6xl mx-auto"
        >
          {/* Controls Bar: Search Indicator & Sort */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground font-light">
                Showing {sortedLocations.length} items
              </span>
              {activeQuery && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs">
                  <Search className="w-3 h-3" />
                  <span>Matching "{searchQuery}"</span>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="hover:text-foreground ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-[180px] text-xs font-light">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {sortedLocations.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <Search className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="text-lg font-medium text-foreground mb-1">No grill items found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5 font-light">
                We couldn't find any menu item matching "{searchQuery}". Try searching for burgers, shawarma, pizza, or BBQ.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSearch}
                className="rounded-full text-xs"
              >
                Clear Search Filter
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedLocations.map((location, index) => (
                <motion.div
                  key={location.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                >
                  <Card className="overflow-hidden border border-border bg-card shadow-soft hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                    <Link to={`/location/${location.id}`} className="block relative h-48 overflow-hidden group">
                      <img
                        src={location.image}
                        alt={location.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="font-light text-xs">{location.rating}</span>
                      </div>
                    </Link>

                    <div className="p-6 flex flex-col flex-1">
                      <Link to={`/location/${location.id}`}>
                        <h3 className="text-base font-medium mb-1 text-card-foreground hover:text-primary transition-colors">
                          {location.name}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-1 text-muted-foreground mb-3 text-xs font-light">
                        <UtensilsCrossed className="h-3 w-3" />
                        <span>{location.location}</span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mb-4 font-light leading-relaxed">
                        {location.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                        {location.features.map((feature) => (
                          <span
                            key={feature}
                            className="text-[10px] uppercase tracking-wide px-2 py-0.5 bg-accent text-accent-foreground rounded font-light"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-border/60">
                        <div>
                          <span className="text-lg font-normal text-foreground">
                            Rs. {location.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-full text-[11px] uppercase tracking-wider px-3.5 h-8 font-normal"
                            onClick={() => {
                              addToCart({
                                id: location.id,
                                name: location.name,
                                price: location.price,
                                image: location.image,
                                notes: location.features.slice(0, 2).join(", "),
                              });
                              setIsCartOpen(true);
                            }}
                          >
                            <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                            Order
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

export default Locations;
