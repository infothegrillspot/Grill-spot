import { Flame, Instagram, Facebook, Twitter, Mail } from "lucide-react";
import { Link } from "react-router-dom";
const Footer = () => {
  return <footer className="bg-foreground text-background py-20 lg:py-24">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col gap-10 lg:gap-12">
          {/* Brand Row */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="h-4 w-4" />
              <span className="text-sm font-normal tracking-wide">The Grill Spot</span>
            </div>
            <p className="text-background/70 text-xs font-light leading-relaxed max-w-xs">
              Burgers, shawarma, pizza, BBQ and more — everything fired over real charcoal, every single day.
            </p>
          </div>

          {/* Pages Row - Two Columns on Mobile */}
          <div>
            <h4 className="text-sm font-medium mb-4">Pages</h4>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3">
              <li>
                <Link to="/" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/locations" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Contact
                </Link>
              </li>
              <li>
                <a href="/#booking" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Reserve a Table
                </a>
              </li>
              <li>
                <Link to="/admin" className="text-background/70 hover:text-background smooth-hover text-xs font-light">
                  Admin Panel
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Row */}
          <div>
            <h4 className="text-sm font-medium mb-4">Contact & Location</h4>
            <div className="flex flex-col gap-2 mb-8">
              <p className="text-background/70 text-xs font-light">
                MM Alam Road, Gulberg III, Lahore, Pakistan
              </p>
              <a href="mailto:hello@thegrillspot.pk" className="text-background/70 hover:text-background smooth-hover text-xs font-light flex items-center gap-2">
                <Mail className="h-3 w-3" />
                hello@thegrillspot.pk
              </a>
              <p className="text-background/70 text-xs font-light">
                Mon - Sun: 12:00 PM - 1:00 AM (PKT)
              </p>
            </div>

            <h4 className="text-sm font-medium mb-4">Follow Us</h4>
            <div className="flex items-center gap-4">
              <a href="#" className="text-background/70 hover:text-background smooth-hover">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" className="text-background/70 hover:text-background smooth-hover">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="text-background/70 hover:text-background smooth-hover">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 mt-12 text-center text-background/50 text-xs font-light">
          <p>&copy; 2026 The Grill Spot. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};
export default Footer;
