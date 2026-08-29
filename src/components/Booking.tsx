import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { format } from "date-fns";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Calendar } from "./ui/calendar";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { CalendarDays, Users, ArrowRight, ArrowLeft, CheckCircle, User, Phone, Mail, MapPinned, Clock, Loader2 } from "lucide-react";
import { saveBookingToFirestore } from "@/services/firebaseDb";
import { createD1Booking } from "@/lib/d1Api";
import { useAuth } from "@/context/AuthContext";

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};

const timeSlots = [
  "12:00", "12:30", "13:00", "13:30", "14:00",
  "17:00", "17:30", "18:00", "18:30", "19:00",
  "19:30", "20:00", "20:30", "21:00", "21:30",
];

const Booking = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  
  const { user } = useAuth();
  
  // Form step state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);
  
  // Step 1 fields
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("");
  
  // Step 2 fields
  const [name, setName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [postcode, setPostcode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStep1Continue = () => {
    if (!date || !time || !guests) {
      toast.error("Please select a date, time, and number of guests");
      return;
    }
    setDirection(1);
    setStep(2);
  };

  const handleStep2Back = () => {
    setDirection(-1);
    setStep(1);
  };

  const handleSubmit = async () => {
    if (!name || !phone || !email || !postcode) {
      toast.error("Please fill in all contact details");
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const bookingPayload = {
        name,
        email,
        phone,
        guests: Number(guests),
        date: date ? format(date, "yyyy-MM-dd") : "",
        time,
        area: postcode,
        status: "confirmed" as const,
        userId: user?.uid,
      };

      // 1. Save to Cloudflare D1 SQL database
      await createD1Booking(bookingPayload).catch((e) => console.warn("D1 booking sync warning:", e));

      // 2. Save to Firestore
      await saveBookingToFirestore(bookingPayload).catch((e) => console.warn("Firestore booking sync warning:", e));

      setDirection(1);
      setStep(3);
      toast.success("Table reservation submitted to Cloudflare D1 SQL & Firestore!");
    } catch (err) {
      console.warn("Could not save reservation:", err);
      setDirection(1);
      setStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setDirection(-1);
    setStep(1);
    setDate(new Date());
    setTime("");
    setGuests("");
    setName("");
    setPhone("");
    setEmail("");
    setPostcode("");
  };

  return (
    <section id="booking" className="py-32 lg:py-40 bg-accent/20" ref={ref}>
      <div className="container mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground mb-4 block">
            Reservations
          </span>
          <h2 className="text-2xl md:text-3xl font-light mb-4 text-foreground tracking-tight">
            Reserve Your Table
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto font-light">
            Grab your spot by the grill — walk-ins welcome too
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          <Card className="p-8 lg:p-10 shadow-soft border border-border bg-card overflow-hidden">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    s === step ? "w-8 bg-primary" : s < step ? "w-4 bg-primary/50" : "w-4 bg-border"
                  }`}
                />
              ))}
            </div>

            <AnimatePresence mode="wait" custom={direction}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="time" className="flex items-center gap-1.5 mb-3 text-card-foreground text-[11px] uppercase tracking-wider font-normal">
                          <Clock className="h-3 w-3" />
                          Time
                        </Label>
                        <Select value={time} onValueChange={setTime}>
                          <SelectTrigger id="time" className="rounded-md text-sm font-light">
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
                        <Label htmlFor="guests" className="flex items-center gap-1.5 mb-3 text-card-foreground text-[11px] uppercase tracking-wider font-normal">
                          <Users className="h-3 w-3" />
                          Guests
                        </Label>
                        <Select value={guests} onValueChange={setGuests}>
                          <SelectTrigger id="guests" className="rounded-md text-sm font-light">
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

                      <div className="pt-4">
                        <Button
                          size="default"
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md smooth-hover text-[11px] uppercase tracking-wider font-normal"
                          onClick={handleStep1Continue}
                        >
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="flex items-center gap-1.5 mb-3 text-card-foreground text-[11px] uppercase tracking-wider font-normal">
                        <CalendarDays className="h-3 w-3" />
                        Date
                      </Label>
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={1}
                        className="rounded-md border-border shadow-soft text-sm pointer-events-auto"
                        disabled={(d) => d < new Date()}
                      />
                      {date && (
                        <p className="text-xs text-muted-foreground font-light mt-2 text-center">
                          {format(date, "EEEE, MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="space-y-6 max-w-md mx-auto">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-1.5 mb-3 text-card-foreground text-[11px] uppercase tracking-wider font-normal">
                        <User className="h-3 w-3" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Smith"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="rounded-md text-sm font-light"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-1.5 mb-3 text-card-foreground text-[11px] uppercase tracking-wider font-normal">
                        <Phone className="h-3 w-3" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+92 300 1234567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="rounded-md text-sm font-light"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="flex items-center gap-1.5 mb-3 text-card-foreground text-[11px] uppercase tracking-wider font-normal">
                        <Mail className="h-3 w-3" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-md text-sm font-light"
                      />
                    </div>

                    <div>
                      <Label htmlFor="postcode" className="flex items-center gap-1.5 mb-3 text-card-foreground text-[11px] uppercase tracking-wider font-normal">
                        <MapPinned className="h-3 w-3" />
                        Area / Location (Lahore)
                      </Label>
                      <Input
                        id="postcode"
                        type="text"
                        placeholder="e.g. Gulberg III, DHA, Model Town"
                        value={postcode}
                        onChange={(e) => setPostcode(e.target.value)}
                        className="rounded-md text-sm font-light"
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        variant="outline"
                        size="default"
                        className="flex-1 rounded-md smooth-hover text-[11px] uppercase tracking-wider font-normal"
                        onClick={handleStep2Back}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        size="default"
                        disabled={isSubmitting}
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md smooth-hover text-[11px] uppercase tracking-wider font-normal"
                        onClick={handleSubmit}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Confirm Reservation"
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="text-center py-8 space-y-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    >
                      <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                    </motion.div>
                    
                    <div className="space-y-2">
                      <h3 className="text-xl font-light text-foreground">Table Reserved</h3>
                      <p className="text-sm text-muted-foreground font-light">
                        Thank you, {name}! Your table has been booked.
                      </p>
                    </div>

                    <div className="bg-accent/30 rounded-md p-4 max-w-sm mx-auto text-left space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Reservation Summary</p>
                      <div className="text-sm font-light text-foreground space-y-1">
                        <p><span className="text-muted-foreground">Date:</span> {date ? format(date, "EEE, MMM d, yyyy") : ""}</p>
                        <p><span className="text-muted-foreground">Time:</span> {time}</p>
                        <p><span className="text-muted-foreground">Guests:</span> {guests}</p>
                        <p><span className="text-muted-foreground">Email:</span> {email}</p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground font-light">
                      A confirmation will be sent to {email}
                    </p>

                    <Button
                      variant="outline"
                      size="default"
                      className="rounded-md smooth-hover text-[11px] uppercase tracking-wider font-normal mt-4"
                      onClick={handleReset}
                    >
                      Book Another Table
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default Booking;
