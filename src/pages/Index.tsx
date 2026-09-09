import { useState } from "react";
import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Locations from "@/components/Locations";
import { MenuSection } from "@/components/MenuSection";
import Experience from "@/components/Experience";
import { AboutSection } from "@/components/AboutSection";
import { ContactSection } from "@/components/ContactSection";
import Footer from "@/components/Footer";
import { DishDetailModal } from "@/components/DishDetailModal";
import { AdminModal } from "@/components/AdminModal";
import { AuthModal } from "@/components/AuthModal";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const [selectedDishId, setSelectedDishId] = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const { isAuthModalOpen, openAuthModal, closeAuthModal } = useAuth();

  return (
    <div className="min-h-screen overflow-x-hidden bg-background pb-20 lg:pb-0">
      {/* Top Navbar */}
      <Navigation
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAuth={() => openAuthModal()}
        onSelectDish={(id) => setSelectedDishId(id)}
      />

      {/* Hero with CTA */}
      <Hero />

      {/* Featured Crowd Favorites Carousel */}
      <Locations onSelectDish={(id) => setSelectedDishId(id)} />

      {/* Complete Interactive Menu Section */}
      <MenuSection onSelectDish={(id) => setSelectedDishId(id)} />

      {/* The Charcoal Way Experience */}
      <Experience />

      {/* About & Craft Story */}
      <AboutSection />

      {/* Contact, Hours & Location */}
      <ContactSection />

      {/* Footer */}
      <Footer onOpenAdmin={() => setIsAdminOpen(true)} />

      {/* Mobile Floating Bottom Bar (App-like quick access for mobile users) */}
      <MobileBottomBar onOpenAuth={() => openAuthModal()} />

      {/* Single-Page Modals & Dialogs (No route changes) */}
      <DishDetailModal
        dishId={selectedDishId}
        isOpen={Boolean(selectedDishId)}
        onClose={() => setSelectedDishId(null)}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />
    </div>
  );
};

export default Index;
