import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Minus, 
  Flame, 
  ShieldCheck, 
  Check, 
  Sparkles,
  ShoppingBag,
  Clock
} from "lucide-react";
import { Location, locations } from "@/data/locations";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

interface DishDetailModalProps {
  dishId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const DishDetailModal = ({ dishId, isOpen, onClose }: DishDetailModalProps) => {
  const { addToCart, setIsCartOpen } = useCart();
  const dish = dishId ? locations.find((item) => item.id === dishId) : null;
  const [quantity, setQuantity] = useState(1);
  const [specialNotes, setSpecialNotes] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const availableOptions = dish?.options || [];
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(() => {
    return availableOptions.length > 0 ? availableOptions[0].id : null;
  });

  if (!dish) return null;

  const allImages = [dish.image, ...(dish.images || [])];
  const selectedOption = availableOptions.find((o) => o.id === selectedOptionId) || null;
  const unitPrice = dish.price + (selectedOption ? selectedOption.price : 0);
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    const itemCartId = selectedOption && selectedOption.price > 0
      ? `${dish.id}_${selectedOption.id}`
      : dish.id;
    const itemName = selectedOption && selectedOption.price > 0
      ? `${dish.name} (${selectedOption.name})`
      : dish.name;
    const itemNotes = [
      selectedOption?.name && selectedOption.name !== "Single Patty" && selectedOption.name !== "Regular Saj Wrap"
        ? `Option: ${selectedOption.name}`
        : null,
      specialNotes.trim() || null,
      dish.features.slice(0, 2).join(", "),
    ]
      .filter(Boolean)
      .join(" • ");

    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: itemCartId,
        name: itemName,
        price: unitPrice,
        image: dish.image,
        notes: itemNotes,
      });
    }
    toast.success(`Added ${quantity}x ${itemName} to cart!`);
    setIsCartOpen(true);
    onClose();
  };

  const nextImg = () => {
    setActiveImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImg = () => {
    setActiveImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 border-border bg-card">
        {/* Gallery Section */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-black/10">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImageIndex}
              src={allImages[activeImageIndex]}
              alt={dish.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

          {allImages.length > 1 && (
            <>
              <button
                type="button"
                onClick={prevImg}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={nextImg}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-medium shadow-sm">
            <Star className="w-3.5 h-3.5 fill-primary text-primary" />
            <span>{dish.rating} (500+ reviews)</span>
          </div>

          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div>
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-primary text-primary-foreground font-semibold rounded-full mb-1.5 inline-block">
                {dish.location}
              </span>
              <h2 className="text-xl sm:text-2xl font-light tracking-tight text-white">{dish.name}</h2>
            </div>
            <div className="text-right">
              <span className="text-2xl font-normal text-white">Rs. {dish.price.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              {dish.description}
            </p>
          </div>

          {/* Charcoal & Quality Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-foreground">Real Charcoal</p>
                <p className="text-[10px] text-muted-foreground font-light truncate">Smoky flame-grilled</p>
              </div>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-foreground">100% Fresh Meat</p>
                <p className="text-[10px] text-muted-foreground font-light truncate">Never frozen</p>
              </div>
            </div>
            <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center gap-2.5 col-span-2 sm:col-span-1">
              <Clock className="w-4 h-4 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-foreground">Fresh to Order</p>
                <p className="text-[10px] text-muted-foreground font-light truncate">15-20 min prep</p>
              </div>
            </div>
          </div>

          {/* Features / Ingredients */}
          <div>
            <h4 className="text-xs uppercase tracking-wider font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" /> Key Ingredients & Specs
            </h4>
            <div className="flex flex-wrap gap-2">
              {dish.features.map((feature, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-accent/60 text-accent-foreground text-xs font-light rounded-md flex items-center gap-1"
                >
                  <Check className="w-3 h-3 text-primary" />
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Customizable Options / Patty Selection */}
          {availableOptions.length > 0 && (
            <div className="space-y-2.5 p-3.5 rounded-xl border border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-foreground flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-primary" /> Select Option / Patty Upgrade
                </h4>
                <span className="text-[11px] text-muted-foreground font-light">Custom upgrade</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {availableOptions.map((opt) => {
                  const isSelected = selectedOptionId === opt.id || (!selectedOptionId && opt.price === 0);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedOptionId(opt.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                          : "border-border bg-card hover:border-border/80 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium text-foreground">{opt.name}</span>
                      </div>

                      <span
                        className={`text-xs font-mono font-semibold ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {opt.price > 0 ? `+ Rs. ${opt.price.toLocaleString()}` : "Included"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Special Instructions Note */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Special Requests or Customizations
            </label>
            <Textarea
              placeholder="e.g. Extra sauce, no onions, mild spice, crispy bun..."
              value={specialNotes}
              onChange={(e) => setSpecialNotes(e.target.value)}
              className="text-xs h-20 resize-none"
            />
          </div>

          {/* Bottom Action: Quantity & Add to Cart */}
          <div className="pt-2 border-t border-border flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 bg-muted/50 border border-border p-1 rounded-full">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="h-8 w-8 rounded-full"
              >
                <Minus className="w-3.5 h-3.5" />
              </Button>
              <span className="text-sm font-semibold w-6 text-center">{quantity}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                className="h-8 w-8 rounded-full"
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <Button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium text-xs uppercase tracking-wider rounded-full shadow-md flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              Add to Order • Rs. {totalPrice.toLocaleString()}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
