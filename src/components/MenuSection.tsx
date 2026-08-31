import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  UtensilsCrossed, 
  Star, 
  ArrowRight, 
  ArrowUpDown, 
  Search, 
  X, 
  ShoppingBag, 
  Flame, 
  Plus, 
  Check, 
  Sparkles,
  Layers
} from "lucide-react";
import { locations, Location } from "@/data/locations";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

interface MenuSectionProps {
  onSelectDish: (dishId: string) => void;
}

type SortOption = "price-low" | "price-high" | "rating" | "popular";

const CATEGORIES = [
  "All Items",
  "Smashed Burgers",
  "Charcoal BBQ",
  "Shawarma & Wraps",
  "Wood-Fired Pizza",
  "Sides & Beverages"
];

export const MenuSection = ({ onSelectDish }: MenuSectionProps) => {
  const [selectedCategory, setSelectedCategory] = useState("All Items");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const { searchQuery, setSearchQuery, addToCart, setIsCartOpen } = useCart();

  const activeQuery = searchQuery.trim().toLowerCase();

  const filteredLocations = useMemo(() => {
    let list = [...locations];

    // 1. Category Filter
    if (selectedCategory !== "All Items") {
      list = list.filter((item) => {
        if (selectedCategory === "Smashed Burgers") {
          return item.name.toLowerCase().includes("burger") || item.description.toLowerCase().includes("patty");
        }
        if (selectedCategory === "Charcoal BBQ") {
          return item.name.toLowerCase().includes("tikka") || item.name.toLowerCase().includes("boti") || item.name.toLowerCase().includes("kabab") || item.name.toLowerCase().includes("bbq") || item.name.toLowerCase().includes("chops");
        }
        if (selectedCategory === "Shawarma & Wraps") {
          return item.name.toLowerCase().includes("shawarma") || item.name.toLowerCase().includes("platter") || item.name.toLowerCase().includes("wrap");
        }
        if (selectedCategory === "Wood-Fired Pizza") {
          return item.name.toLowerCase().includes("pizza") || item.description.toLowerCase().includes("dough");
        }
        if (selectedCategory === "Sides & Beverages") {
          return item.name.toLowerCase().includes("fries") || item.name.toLowerCase().includes("wings") || item.name.toLowerCase().includes("shake") || item.name.toLowerCase().includes("drink") || item.name.toLowerCase().includes("garlic");
        }
        return true;
      });
    }

    // 2. Search Query Filter
    if (activeQuery) {
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(activeQuery) ||
          item.description.toLowerCase().includes(activeQuery) ||
          item.features.some((f) => f.toLowerCase().includes(activeQuery)) ||
          item.details.some((d) => d.toLowerCase().includes(activeQuery)) ||
          item.location.toLowerCase().includes(activeQuery)
      );
    }

    // 3. Sorting
    switch (sortBy) {
      case "price-low":
        return list.sort((a, b) => a.price - b.price);
      case "price-high":
        return list.sort((a, b) => b.price - a.price);
      case "rating":
        return list.sort((a, b) => b.rating - a.rating);
      case "popular":
      default:
        return list;
    }
  }, [selectedCategory, activeQuery, sortBy]);

  const handleQuickAdd = (item: Location, e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      notes: item.features.slice(0, 2).join(", "),
    });
    toast.success(`Added ${item.name} to cart!`);
  };

  return (
    <section id="menu" className="py-24 lg:py-32 bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
            <Flame className="w-3.5 h-3.5" />
            <span>Fired Over Real Charcoal</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground mb-3">
            Our Complete Grill Menu
          </h2>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Order fresh smashed burgers, wood-fired pizzas, spit-roasted shawarma, and signature BBQ platters delivered piping hot to your door in Lahore.
          </p>
        </div>

        {/* Category Pills & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort & Count */}
          <div className="flex items-center justify-between sm:justify-end gap-3 flex-shrink-0">
            <span className="text-xs text-muted-foreground font-light">
              Showing <span className="font-medium text-foreground">{filteredLocations.length}</span> dishes
            </span>

            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(val: SortOption) => setSortBy(val)}>
                <SelectTrigger className="w-[150px] h-9 text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Top Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Active Search Badge */}
        {searchQuery.trim() && (
          <div className="mb-6 flex items-center gap-2 p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-xs">
            <Search className="w-4 h-4 text-primary" />
            <span className="text-foreground">
              Filtering results for: <strong>"{searchQuery}"</strong>
            </span>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="ml-auto text-primary hover:underline flex items-center gap-1"
            >
              Clear filter <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dish Grid */}
        {filteredLocations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredLocations.map((item) => (
              <Card
                key={item.id}
                onClick={() => onSelectDish(item.id)}
                className="group overflow-hidden border border-border/80 bg-card hover:border-primary/40 hover:shadow-lg transition-all duration-300 rounded-2xl flex flex-col cursor-pointer"
              >
                {/* Image & Badges */}
                <div className="relative h-52 sm:h-56 overflow-hidden bg-black/10">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md text-white text-[10px] uppercase font-semibold tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Flame className="w-3 h-3 text-primary fill-primary" />
                    <span>{item.location}</span>
                  </div>

                  <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-sm text-xs font-medium">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-foreground">{item.rating}</span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                    <span className="text-lg sm:text-xl font-medium drop-shadow-sm">
                      Rs. {item.price.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors tracking-tight mb-1.5">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-light line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Feature Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.features.slice(0, 3).map((feat, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] uppercase tracking-wide px-2 py-0.5 bg-muted text-muted-foreground rounded-md font-light"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>

                  {/* Action Row */}
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDish(item.id);
                      }}
                      className="text-xs text-muted-foreground hover:text-foreground font-normal px-2 h-8"
                    >
                      Details & Notes
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={(e) => handleQuickAdd(item, e)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs font-medium h-8 px-3.5 flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-muted/20 border border-border rounded-2xl max-w-md mx-auto">
            <UtensilsCrossed className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h4 className="text-sm font-semibold text-foreground mb-1">No matching dishes found</h4>
            <p className="text-xs text-muted-foreground font-light mb-4">
              Try searching with different keywords or select another category.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All Items");
              }}
              className="text-xs rounded-full"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
