import { useState } from "react";
import { D1MenuItem, createD1MenuItem, updateD1MenuItem, deleteD1MenuItem } from "@/lib/d1Api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  UtensilsCrossed,
  Plus,
  Search,
  Trash2,
  Edit2,
  Flame,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  DollarSign,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

interface MenuManagementProps {
  menuList: D1MenuItem[];
  onRefresh: () => void;
}

const CATEGORIES = [
  "Smashed Burgers",
  "Shawarma",
  "Wood-Fired Pizza",
  "Charcoal BBQ",
  "Sides & Fries",
  "Drinks & Shakes",
  "Desserts",
];

const SPICE_LEVELS = ["None", "Mild", "Medium", "Hot", "Extra Spicy (Lahori Heat)"];

export const MenuManagement = ({ menuList, onRefresh }: MenuManagementProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<D1MenuItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState<number>(1450);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80");
  const [featuresString, setFeaturesString] = useState("Charcoal grilled, House sauce, Brioche bun");
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [isFeatured, setIsFeatured] = useState<boolean>(false);
  const [spiceLevel, setSpiceLevel] = useState("Medium");
  const [prepTime, setPrepTime] = useState("12-15 mins");

  const openAddModal = () => {
    setEditingItem(null);
    setName("");
    setCategory(CATEGORIES[0]);
    setPrice(1250);
    setDescription("Freshly prepared with authentic Lahori charcoal spices and premium ingredients.");
    setImage("https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80");
    setFeaturesString("Smoked Charcoal, House Sauce, Fresh Bun");
    setIsAvailable(true);
    setIsFeatured(false);
    setSpiceLevel("Medium");
    setPrepTime("15 mins");
    setIsDialogOpen(true);
  };

  const openEditModal = (item: D1MenuItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category || CATEGORIES[0]);
    setPrice(Number(item.price) || 0);
    setDescription(item.description || "");
    setImage(item.image || "");
    const feats = Array.isArray(item.features)
      ? item.features.join(", ")
      : typeof item.features === "string" && item.features.startsWith("[")
      ? JSON.parse(item.features || "[]").join(", ")
      : String(item.features || "");
    setFeaturesString(feats);
    setIsAvailable(Boolean(item.isAvailable));
    setIsFeatured(Boolean(item.isFeatured));
    setSpiceLevel(item.spiceLevel || "Medium");
    setPrepTime(item.prepTime || "15 mins");
    setIsDialogOpen(true);
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || price <= 0) {
      toast.error("Item name and a valid price (PKR) are required");
      return;
    }

    setIsSubmitting(true);
    const parsedFeatures = featuresString
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    try {
      if (editingItem) {
        await updateD1MenuItem(editingItem.id, {
          name,
          category,
          price: Number(price),
          description,
          image,
          features: JSON.stringify(parsedFeatures),
          isAvailable: isAvailable ? 1 : 0,
          isFeatured: isFeatured ? 1 : 0,
          spiceLevel,
          prepTime,
        });
        toast.success(`Updated "${name}" in menu`);
      } else {
        await createD1MenuItem({
          name,
          category,
          price: Number(price),
          description,
          image,
          features: JSON.stringify(parsedFeatures),
          isAvailable: isAvailable ? 1 : 0,
          isFeatured: isFeatured ? 1 : 0,
          spiceLevel,
          prepTime,
        });
        toast.success(`Created new dish: "${name}"`);
      }
      setIsDialogOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save menu item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, itemName: string) => {
    if (window.confirm(`Are you sure you want to remove "${itemName}" from the active menu?`)) {
      await deleteD1MenuItem(id);
      toast.success(`Removed "${itemName}" from menu`);
      onRefresh();
    }
  };

  const toggleAvailability = async (item: D1MenuItem) => {
    const nextVal = item.isAvailable ? 0 : 1;
    await updateD1MenuItem(item.id, { isAvailable: nextVal });
    toast.success(`"${item.name}" is now marked ${nextVal ? "In Stock" : "Sold Out"}`);
    onRefresh();
  };

  const filteredMenu = menuList.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <Card className="p-4 border border-border shadow-soft bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-foreground">Live Menu & Culinary Catalog</h3>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px]">
                {menuList.length} Total Dishes
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-light">
              Add new burgers, shawarma, charcoal BBQ platters, edit prices in PKR, and manage live stock
            </p>
          </div>
        </div>

        <Button
          onClick={openAddModal}
          className="h-9 px-4 text-xs font-normal bg-primary text-primary-foreground hover:bg-primary/90 rounded-md gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Menu Item
        </Button>
      </Card>

      {/* Category Pills & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search dishes by name, ingredients, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-card border-border"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === "all"
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All Items ({menuList.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = menuList.filter((m) => m.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground font-medium"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat} {count > 0 ? `(${count})` : ""}
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Grid */}
      {filteredMenu.length === 0 ? (
        <Card className="p-12 text-center border-border">
          <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40 stroke-1" />
          <p className="text-sm font-medium text-foreground">No menu items found</p>
          <p className="text-xs text-muted-foreground mt-1">Try selecting another category or add a new dish.</p>
          <Button onClick={openAddModal} variant="outline" size="sm" className="mt-4 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Item Now
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMenu.map((item) => {
            const inStock = Boolean(item.isAvailable);
            const features = Array.isArray(item.features)
              ? item.features
              : typeof item.features === "string" && item.features.startsWith("[")
              ? JSON.parse(item.features || "[]")
              : typeof item.features === "string" && item.features
              ? item.features.split(",")
              : [];

            return (
              <Card
                key={item.id}
                className={`overflow-hidden border border-border bg-card shadow-soft flex flex-col justify-between transition-all ${
                  !inStock ? "opacity-60 grayscale-[40%]" : ""
                }`}
              >
                <div>
                  {/* Image Container */}
                  <div className="relative h-40 w-full overflow-hidden bg-muted">
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80";
                      }}
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-[10px] text-foreground font-normal">
                        {item.category}
                      </Badge>
                      {Boolean(item.isFeatured) && (
                        <Badge className="bg-amber-500 text-white text-[10px] gap-1 px-1.5">
                          <Sparkles className="w-3 h-3" /> Chef Pick
                        </Badge>
                      )}
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      <button
                        type="button"
                        onClick={() => toggleAvailability(item)}
                        title="Click to toggle in-stock / sold out"
                      >
                        <Badge
                          variant="outline"
                          className={`text-[10px] backdrop-blur-sm ${
                            inStock
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                              : "bg-rose-950/80 text-rose-300 border-rose-500/40"
                          }`}
                        >
                          {inStock ? "In Stock" : "Sold Out"}
                        </Badge>
                      </button>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium text-foreground line-clamp-1">{item.name}</h4>
                      <span className="text-sm font-bold text-primary whitespace-nowrap font-mono">
                        Rs. {Number(item.price).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground font-light line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Tags / Meta */}
                    <div className="flex items-center gap-3 pt-2 text-[11px] text-muted-foreground font-light">
                      {item.spiceLevel && item.spiceLevel !== "None" && (
                        <div className="flex items-center gap-1 text-orange-500">
                          <Flame className="w-3 h-3" />
                          <span>{item.spiceLevel}</span>
                        </div>
                      )}
                      {item.prepTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.prepTime}</span>
                        </div>
                      )}
                    </div>

                    {features.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {features.slice(0, 3).map((f: string, i: number) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground font-light"
                          >
                            {f.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-mono">ID: {item.id}</span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(item)}
                      className="h-7 text-xs px-2.5 gap-1"
                    >
                      <Edit2 className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id, item.name)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      title="Delete dish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Menu Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border text-foreground max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveMenu}>
            <DialogHeader>
              <DialogTitle className="text-base font-normal tracking-tight flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-primary" />
                {editingItem ? `Edit "${editingItem.name}"` : "Add New Dish to Menu"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-light">
                Configure item pricing, charcoal flavors, image URL, and customer display settings.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 py-4 text-xs font-light">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-muted-foreground mb-1">Dish Name *</label>
                  <Input
                    required
                    placeholder="e.g. Charcoal Malai Boti Smash"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-8 text-xs bg-background border-border"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground mb-1">Price (PKR) *</label>
                  <Input
                    required
                    type="number"
                    min="1"
                    placeholder="1450"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="h-8 text-xs bg-background border-border font-mono font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Menu Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1">Spice Level</label>
                  <select
                    value={spiceLevel}
                    onChange={(e) => setSpiceLevel(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground"
                  >
                    {SPICE_LEVELS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Description</label>
                <Textarea
                  rows={2}
                  placeholder="Describe the cuts of meat, house marinades, toppings, and sauces..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="text-xs bg-background border-border resize-none"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Food Image URL</label>
                <Input
                  placeholder="https://images.unsplash.com/..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="h-8 text-xs bg-background border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Key Features (comma-separated)</label>
                  <Input
                    placeholder="Charcoal grilled, House sauce, Brioche bun"
                    value={featuresString}
                    onChange={(e) => setFeaturesString(e.target.value)}
                    className="h-8 text-xs bg-background border-border"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1">Prep Time</label>
                  <Input
                    placeholder="12-15 mins"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    className="h-8 text-xs bg-background border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 rounded-md border border-border bg-background cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="rounded text-primary focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-medium text-foreground block">In Stock (Available)</span>
                    <span className="text-[10px] text-muted-foreground">Customers can add to cart</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-md border border-border bg-background cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-primary focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-medium text-foreground block">Chef's Pick</span>
                    <span className="text-[10px] text-muted-foreground">Highlight on homepage</span>
                  </div>
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "Saving..." : editingItem ? "Update Dish" : "Create Dish"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
