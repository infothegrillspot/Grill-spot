import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, UtensilsCrossed, Star, Clock, ChevronLeft, ChevronRight, Quote, ShoppingBag } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useState } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { toast } from "sonner";
import { getLocationById } from "@/data/locations";
import { useCart } from "@/context/CartContext";

const timeSlots = [
  "12:00", "12:30", "13:00", "13:30", "14:00",
  "17:00", "17:30", "18:00", "18:30", "19:00",
  "19:30", "20:00", "20:30", "21:00", "21:30",
];

const LocationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, setIsCartOpen } = useCart();
  const location = id ? getLocationById(id) : null;
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("");
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

  const handleBooking = () => {
    if (!date || !time || !guests) {
      toast.error("Please select a date, time, and number of guests");
      return;
    }
    toast.success(`Table reserved! Get ready for ${location.name}.`);
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
                <Card className="p-8 border border-border shadow-soft">
                  <div className="mb-8">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-2xl font-light">Rs. {location.price.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground font-light">starting price</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <span className="font-light">{location.rating}</span>
                      <span className="text-muted-foreground ml-2">Lahore Grill Special</span>
                    </div>
                  </div>

                  {/* Add to Cart Quick Action */}
                  <div className="mb-6 pb-6 border-b border-border">
                    <Button
                      type="button"
                      className="w-full rounded-md text-[11px] uppercase tracking-wider font-normal flex items-center justify-center gap-2 mb-2"
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
                      <ShoppingBag className="w-4 h-4" />
                      Add to Cart (Rs. {location.price.toLocaleString()})
                    </Button>
                    <p className="text-[11px] text-center text-muted-foreground font-light">
                      Order for takeaway or delivery across Lahore
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="text-xs uppercase tracking-wider font-medium text-foreground">
                      Or Dine-in Table Reservation
                    </div>
                    <div>
                      <Label htmlFor="detail-guests" className="text-[11px] uppercase tracking-wider font-normal mb-3 block">
                        Guests
                      </Label>
                      <Select value={guests} onValueChange={setGuests}>
                        <SelectTrigger id="detail-guests" className="rounded-md text-sm font-light">
                          <SelectValue placeholder="Select guests" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Guest</SelectItem>
                          <SelectItem value="2">2 Guests</SelectItem>
                          <SelectItem value="3">3 Guests</SelectItem>
                          <SelectItem value="4">4 Guests</SelectItem>
                          <SelectItem value="5">5+ Guests</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="detail-time" className="text-[11px] uppercase tracking-wider font-normal mb-3 block">
                        Time
                      </Label>
                      <Select value={time} onValueChange={setTime}>
                        <SelectTrigger id="detail-time" className="rounded-md text-sm font-light">
                          <SelectValue placeholder="Select a time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((slot) => (
                            <SelectItem key={slot} value={slot}>
                              {slot}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-[11px] uppercase tracking-wider font-normal mb-3 block">
                        Date
                      </Label>
                      <CalendarComponent
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={1}
                        className="rounded-md border-border text-sm pointer-events-auto"
                        disabled={(d) => d < new Date()}
                      />
                      {date && (
                        <p className="text-xs text-muted-foreground font-light mt-2 text-center">
                          {format(date, "EEE, MMM d, yyyy")}
                        </p>
                      )}
                    </div>

                    <Button
                      size="default"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md smooth-hover text-[11px] uppercase tracking-wider font-normal"
                      onClick={handleBooking}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Reserve a Table
                    </Button>
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
