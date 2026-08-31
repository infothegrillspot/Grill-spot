import { Flame, Instagram, Facebook, Twitter, Mail, ShieldCheck } from "lucide-react";

interface FooterProps {
  onOpenAdmin?: () => void;
}

const Footer = ({ onOpenAdmin }: FooterProps) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-foreground text-background py-20 lg:py-24">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col gap-10 lg:gap-12">
          {/* Brand Row */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-4 w-4 text-primary" />
              <span className="text-sm font-normal tracking-wide">The Grill Spot</span>
              <span className="text-[10px] uppercase tracking-widest text-primary font-semibold">Lahore</span>
            </div>
            <p className="text-background/70 text-xs font-light leading-relaxed max-w-xs">
              Burgers, shawarma, pizza, BBQ and more — everything fired over real charcoal, every single day on MM Alam Road.
            </p>
          </div>

          {/* Pages Row - In-page Smooth Navigation */}
          <div>
            <h4 className="text-sm font-medium mb-4 text-white">Experience & Quick Links</h4>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("top")}
                  className="text-background/70 hover:text-background transition-colors text-xs font-light text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("menu")}
                  className="text-background/70 hover:text-background transition-colors text-xs font-light text-left"
                >
                  Our Menu & Order
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("experience")}
                  className="text-background/70 hover:text-background transition-colors text-xs font-light text-left"
                >
                  The Charcoal Way
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("about")}
                  className="text-background/70 hover:text-background transition-colors text-xs font-light text-left"
                >
                  About Our Kitchen
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollTo("contact")}
                  className="text-background/70 hover:text-background transition-colors text-xs font-light text-left"
                >
                  Contact & Location
                </button>
              </li>
              {onOpenAdmin && (
                <li className="col-span-2 pt-1">
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="text-primary hover:underline transition-colors text-xs font-medium flex items-center gap-1.5"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Kitchen & Admin Portal
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Contact Row */}
          <div>
            <h4 className="text-sm font-medium mb-4 text-white">Contact & Location</h4>
            <div className="flex flex-col gap-2 mb-8">
              <p className="text-background/70 text-xs font-light">
                Plot 14-C, MM Alam Road, Gulberg III, Lahore, Pakistan
              </p>
              <a
                href="mailto:hello@thegrillspot.pk"
                className="text-background/70 hover:text-background transition-colors text-xs font-light flex items-center gap-2"
              >
                <Mail className="h-3 w-3" />
                hello@thegrillspot.pk
              </a>
              <p className="text-background/70 text-xs font-light">
                Mon - Sun: 12:00 PM - 1:00 AM (PKT)
              </p>
            </div>

            <h4 className="text-sm font-medium mb-4 text-white">Follow Us</h4>
            <div className="flex items-center gap-4">
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 mt-12 text-center text-background/50 text-xs font-light">
          <p>&copy; 2026 The Grill Spot • Lahore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
