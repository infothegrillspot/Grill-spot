import { motion } from "framer-motion";
import { Flame, Heart, ChefHat, Drumstick, Users, Leaf, ShieldCheck, Sparkles } from "lucide-react";
import interiorImg from "@/assets/grill-interior.jpg";

const values = [
  {
    icon: Flame,
    title: "100% Real Charcoal Fire",
    description: "No gas grills, no lava rocks — every piece of meat is cooked over hardwood lump charcoal for authentic smoky depth.",
  },
  {
    icon: Heart,
    title: "Made In-House Daily",
    description: "Our signature garlic sauce, fiery peri dips, marinades, and fresh brioche buns are crafted in our kitchen from scratch.",
  },
  {
    icon: Drumstick,
    title: "Fresh Never Frozen Meat",
    description: "Locally sourced premium beef and chicken delivered daily, trimmed and marinated 24 hours prior to grilling.",
  },
  {
    icon: ChefHat,
    title: "Pitmaster Craft",
    description: "Our grill masters monitor coal temperatures continuously to lock in juices and deliver the perfect sear.",
  },
  {
    icon: Users,
    title: "Lahore's Community Table",
    description: "A welcoming spot on MM Alam Road where friends and families gather for late-night platters and great conversation.",
  },
  {
    icon: Leaf,
    title: "Crisp Fresh Produce",
    description: "Farm-fresh vegetables chopped fresh throughout the day so every shawarma and burger has that satisfying crunch.",
  },
];

export const AboutSection = () => {
  return (
    <section id="about" className="py-24 lg:py-32 bg-secondary/30 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
          {/* Story Text */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Our Story & Philosophy</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
              Real Charcoal. Honest Food. No Shortcuts.
            </h2>
            <div className="space-y-4 text-sm text-muted-foreground font-light leading-relaxed">
              <p>
                The Grill Spot started with a simple belief: great grilled food shouldn't be reserved for special occasions or complicated reservations. It should be bold, honest, and served hot off the grill — the exact food you crave any night of the week.
              </p>
              <p>
                Founded in Lahore, we built our kitchen around one centerpiece: an authentic charcoal grill. No gas valves, no electric griddles, no heat lamps. Just real fire, hardwood smoke, and ingredients treated with the highest culinary respect.
              </p>
              <p>
                From hand-smashed beef patties to spit-roasted shawarma and wood-fired pizzas, everything on our menu passes directly over glowing coals. The fire never goes out, and neither does our dedication to every plate.
              </p>
            </div>
          </div>

          {/* Interior Image */}
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl h-80 sm:h-96">
            <img
              src={interiorImg}
              alt="The Grill Spot open kitchen"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <p className="text-xs uppercase tracking-widest text-primary font-semibold mb-1">MM Alam Road, Lahore</p>
              <p className="text-base font-light">Where live charcoal meets street food perfection.</p>
            </div>
          </div>
        </div>

        {/* 6 Value Pillars */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-12">
            <h3 className="text-2xl font-light text-foreground mb-2">Why Our Grill Tastes Different</h3>
            <p className="text-xs text-muted-foreground font-light">
              Six uncompromising commitments that define every meal we serve
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => {
              const Icon = v.icon;
              return (
                <div
                  key={i}
                  className="p-6 bg-card border border-border rounded-2xl shadow-soft space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground tracking-tight">{v.title}</h4>
                  <p className="text-xs text-muted-foreground font-light leading-relaxed">
                    {v.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
