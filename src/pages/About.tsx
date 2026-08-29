import { motion, useScroll, useTransform } from "framer-motion";
import { Flame, Heart, ChefHat, Drumstick, Users, Leaf } from "lucide-react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import bannerImage from "@/assets/grill-interior.jpg";

const values = [
  {
    icon: Flame,
    title: "Real Fire",
    description: "Everything cooked over real charcoal — because gas grills just don't taste the same."
  },
  {
    icon: Heart,
    title: "Made With Love",
    description: "Every marinade, sauce, and dough is prepared by hand in our kitchen, every single day."
  },
  {
    icon: ChefHat,
    title: "Craft First",
    description: "Our chefs obsess over the details — from the 24-hour marinades to the perfect char."
  },
  {
    icon: Drumstick,
    title: "Quality Meat",
    description: "Fresh, locally sourced, never frozen. If we wouldn't serve it to family, we won't serve it."
  },
  {
    icon: Users,
    title: "Community Table",
    description: "A place where neighbors become friends over shared platters and good conversation."
  },
  {
    icon: Leaf,
    title: "Fresh Always",
    description: "Produce delivered daily, herbs chopped to order, and nothing that ever sees a freezer."
  }
];

const About = () => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 150]);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navigation />
      
      {/* Hero Image with Parallax */}
      <div className="relative w-full h-[50vh] overflow-hidden">
        <motion.img
          src={bannerImage}
          alt="The Grill Spot open charcoal kitchen"
          style={{ y }}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 w-full h-[120%] object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <main>
        {/* Our Story Section */}
        <section className="py-24 lg:py-32 px-6 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">About Us</span>
              <h1 className="text-2xl md:text-3xl font-light tracking-tight mt-2 mb-8">Our Story</h1>
              
              <div className="space-y-6 text-muted-foreground font-light leading-relaxed">
                <p>
                  The Grill Spot started with a simple frustration: great grilled food shouldn't require a
                  special occasion or a reservation weeks in advance. It should be bold, honest, and served
                  hot — the kind of food you crave on a Tuesday night.
                </p>
                <p>
                  Founded in 2019, we built our kitchen around one centerpiece: a charcoal grill. No gas,
                  no shortcuts, no heat lamps. Just fire, smoke, and ingredients treated with respect.
                  From hand-smashed burgers to spit-roasted shawarma and wood-fired pizzas, everything
                  on our menu passes over real flames.
                </p>
                <p>
                  Today, The Grill Spot is where the neighborhood gathers — for quick lunches, family
                  dinners, and late-night loaded fries. The fire never goes out, and neither does our
                  obsession with getting every plate right.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Fire Matters Section */}
        <section className="py-24 lg:py-32 px-6 lg:px-12 bg-secondary/30">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">The Why</span>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight mt-2 mb-8">Why We Cook Over Fire</h2>
              
              <div className="space-y-6 text-muted-foreground font-light leading-relaxed">
                <p>
                  Charcoal grilling isn't a gimmick — it's chemistry. When fat drips onto glowing coals,
                  it vaporizes and rises back up, coating the food in compounds that gas flames simply
                  can't produce. That's the smoky depth you taste in every bite.
                </p>
                <p>
                  Fire also demands attention. It can't be set to a number and forgotten. Our grill chefs
                  read the coals, move the food, and adjust by hand — the way cooking was done for
                  thousands of years before convenience took over.
                </p>
                <p>
                  But it's not just about flavor — it's about honesty. An open grill means you can see
                  exactly how your food is made. Nothing hidden, nothing artificial. Just fire, smoke,
                  and skill.
                </p>
                <p>
                  At The Grill Spot, we believe fast food can be real food. And real food deserves real fire.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-24 lg:py-32 px-6 lg:px-12">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">What We Stand For</span>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight mt-2">Our Values</h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="p-8 border border-border rounded-lg bg-card shadow-soft hover:shadow-md transition-shadow duration-300"
                >
                  <value.icon className="h-6 w-6 text-primary mb-4" />
                  <h3 className="text-lg font-light tracking-tight mb-3">{value.title}</h3>
                  <p className="text-sm text-muted-foreground font-light leading-relaxed">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
