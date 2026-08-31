import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  MessageSquare, 
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

export const ContactSection = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error("Please fill in your name, email, and message");
      return;
    }

    setIsSubmitting(true);
    // Simulate brief send
    await new Promise((r) => setTimeout(r, 600));
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success("Message sent! Our team will get back to you shortly.");
  };

  return (
    <section id="contact" className="py-24 lg:py-32 bg-background border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Visit Us & Say Hello</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground mb-3">
            Contact & Location
          </h2>
          <p className="text-sm text-muted-foreground font-light leading-relaxed">
            Have a catering request, large family gathering, feedback, or need delivery assistance? Reach out to our Lahore team anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* Branch & Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="p-6 border-border shadow-soft bg-card space-y-6">
              <div>
                <h3 className="text-base font-semibold text-foreground mb-1">Main Flagship Branch</h3>
                <p className="text-xs text-muted-foreground font-light">
                  MM Alam Road, Gulberg III, Lahore, Pakistan
                </p>
              </div>

              <div className="space-y-4 pt-2 border-t border-border">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Address</p>
                    <p className="text-xs text-muted-foreground font-light">
                      Plot 14-C, MM Alam Road, Gulberg III, Lahore
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Phone / WhatsApp</p>
                    <p className="text-xs text-muted-foreground font-light">
                      +92 (42) 3575-GRILL / +92 300 0000000
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Email</p>
                    <p className="text-xs text-muted-foreground font-light">
                      hello@thegrillspot.pk / info.thegrillspot@gmail.com
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">Hours of Operation</p>
                    <p className="text-xs text-muted-foreground font-light">
                      Monday – Sunday: 12:00 PM – 1:00 AM (PKT)
                    </p>
                    <p className="text-[11px] text-primary font-medium mt-0.5">
                      • Kitchen stays live until 12:45 AM
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <Card className="p-6 sm:p-8 border-border shadow-soft bg-card">
              {submitted ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Thank you for your message!</h3>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto font-light">
                    We have received your note and our team will get in touch with you as soon as possible.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSubmitted(false);
                      setName("");
                      setEmail("");
                      setPhone("");
                      setMessage("");
                    }}
                    className="rounded-full text-xs"
                  >
                    Send Another Note
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="text-base font-semibold text-foreground mb-2">Send us a Message</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Your Name *</Label>
                      <Input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Bilal Khan"
                        className="text-xs h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium mb-1 block">Email Address *</Label>
                      <Input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@gmail.com"
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium mb-1 block">Phone / WhatsApp (Optional)</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+92 300 1234567"
                      className="text-xs h-9"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium mb-1 block">Message / Inquiry *</Label>
                    <Textarea
                      required
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you need (event catering, table reservation inquiry, feedback)..."
                      className="text-xs h-28 resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? "Sending..." : "Submit Message"}
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};
