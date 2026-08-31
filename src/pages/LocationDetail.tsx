import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, UtensilsCrossed, Star, ChevronLeft, ChevronRight, Quote, ShoppingBag, Plus, Minus, Check, ShieldCheck, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { toast } from "sonner";
import { getLocationById } from "@/data/locations";
import { useCart } from "@/context/CartContext";

const LocationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const location = id ? getLocationById(id) : null;
  const [quantity, setQuantity] = useState(1);
  const [specialNote, setSpecialNote] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-light mb-4">Menu item not found</h1>
          <Button onClick={() => navigate("/")} variant="outline" size="sm" className="text-xs font-light">
            Return Home
          </Button>
        </div>
      </div>
    );
  }

  // Combine main image with detail images for the gallery
  const allImages = [location.image, ...location.images];

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart({
        id: location.id,
        name: location.name,
        price: location.price,
        image: location.image,
        notes: specialNote || location.features.slice(0, 2).join(", "),
      });
    }
    toast.success(`Added ${quantity}x ${location.name} to cart!`);
    setIsCartOpen(true);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      
      {/* Hero Image with Parallax */}
      <div className="relative w-full h-[50vh] overflow-hidden">
        <motion.img
          src={allImages[0]}
          alt={location.name}
          style={{ y }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 w-full h-[120%] object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>
      
      <main>
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-12 lg:py-16 max-w-full overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/locations")}
            className="mb-8 text-[11px] uppercase tracking-wider font-normal"
          >
            <ArrowLeft className="mr-2 h-3 w-3" />
            Back to menu
          </Button>

          {/* Title, Description, Rating */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <UtensilsCrossed className="h-3 w-3" />
              <span className="font-light">{location.location}</span>
              <div className="flex items-center gap-1 ml-4">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span className="font-light text-foreground">{location.rating}</span>
              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-light mb-4 tracking-tight">
              {location.name}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed font-light max-w-2xl">
              {location.description}
            </p>
          </motion.div>

          {/* Full Width Image Slideshow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative w-full h-[50vh] lg:h-[60vh] mb-16 rounded-lg overflow-hidden max-w-full"
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImageIndex}
                src={allImages[currentImageIndex]}
                alt={`${location.name} ${currentImageIndex + 1}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>
            
            {/* Navigation Arrows */}
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>

            {/* Image Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                />
              ))}
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-light">
              {currentImageIndex + 1} / {allImages.length}
            </div>
          </motion.div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-16">
            <div className="lg:col-span-2 space-y-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="p-8 border border-border shadow-soft">
                  <h2 className="text-[11px] uppercase tracking-wider font-normal mb-6">Why You'll Love It</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {location.amenities.map((amenity, index: number) => {
                      const Icon = amenity.icon;
                      return (
                        <div key={index} className="flex gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Icon className="h-4 w-4 text-primary" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-normal mb-1">{amenity.label}</h3>
                            <p className="text-xs text-muted-foreground font-light">{amenity.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="p-8 border border-border shadow-soft">
                  <h2 className="text-[11px] uppercase tracking-wider font-normal mb-6">On The Menu</h2>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {location.details.map((detail: string, index: number) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground font-light">
                        <span className="text-primary mt-0.5">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>

              {/* Reviews Carousel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <Card className="p-8 border border-border shadow-soft">
                  <h2 className="text-[11px] uppercase tracking-wider font-normal mb-6">What Diners Say</h2>
                  <Carousel
                    opts={{
                      align: "start",
                      loop: true,
                    }}
                    className="w-full"
                  >
                    <CarouselContent className="-ml-4">
                      {location.reviews.map((review, index) => (
                        <CarouselItem key={index} className="pl-4 md:basis-1/2">
                          <div className="h-full p-6 bg-accent/30 rounded-lg">
                            <Quote className="h-6 w-6 text-primary/30 mb-4" />
                            <div className="flex items-center gap-1 mb-3">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < review.rating
                                      ? "fill-primary text-primary"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                            <p className="text-sm text-muted-foreground font-light mb-4 leading-relaxed">
                              "{review.comment}"
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-normal text-foreground">{review.author}</span>
                              <span className="text-xs text-muted-foreground font-light">{review.date}</span>
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <CarouselPrevious className="static translate-y-0" />
                      <CarouselNext className="static translate-y-0" />
                    </div>
                  </Carousel>
                </Card>
              </motion.div>
            </div>

            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="sticky top-24"
              >
                <Card className="p-8 border border-border shadow-soft bg-card">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-light text-foreground">Rs. {(location.price * quantity).toLocaleString()}</span>
                      {quantity > 1 && (
                        <span className="text-xs text-muted-foreground font-light">
                          (Rs. {location.price.toLocaleString()} each)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-light">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      <span className="font-normal text-foreground">{location.rating}</span>
                      <span>•</span>
                      <span>Lahore Grill Master Special</span>
                    </div>
                  </div>

                  {/* Quantity and Order Options */}
                  <div className="space-y-5 mb-6">
                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-normal text-foreground mb-2.5 block">
                        Quantity
                      </label>
                      <div className="flex items-center justify-between border border-border rounded-lg p-1.5 bg-background">
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                          className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="font-medium text-sm text-foreground">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity((q) => q + 1)}
                          className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] uppercase tracking-wider font-normal text-foreground mb-2 block">
                        Special Instructions (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Extra garlic sauce, well done patty"
                        value={specialNote}
                        onChange={(e) => setSpecialNote(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground/60 font-light"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2.5 mb-6">
                    <Button
                      type="button"
                      size="lg"
                      className="w-full rounded-full text-xs uppercase tracking-wider font-normal flex items-center justify-center gap-2 shadow-sm"
                      onClick={handleAddToCart}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart • Rs. {(location.price * quantity).toLocaleString()}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full text-[11px] uppercase tracking-wider font-light"
                      onClick={() => navigate("/locations")}
                    >
                      Browse Full Menu
                    </Button>
                  </div>

                  {/* Trust Highlights */}
                  <div className="pt-5 border-t border-border/80 space-y-2 text-xs text-muted-foreground font-light">
                    <div className="flex items-center gap-2">
                      <Flame className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span>Wood-fired & charcoal grilled fresh to order</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span>100% Certified Halal, MM Alam Rd Lahore</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LocationDetail;
