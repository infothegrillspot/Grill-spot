import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Users,
  DollarSign,
  MapPin,
  Mail,
  Phone,
  X,
  LogOut,
  ShoppingBag,
  UtensilsCrossed,
  ChefHat,
  Bike,
  Database,
  RefreshCw,
  ShieldCheck,
  Server,
  Activity,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import {
  fetchD1Orders,
  fetchD1Bookings,
  fetchAllD1Users,
  fetchD1Staff,
  fetchD1Riders,
  fetchD1Menu,
  fetchD1Stats,
  checkD1Health,
  D1Order,
  D1Booking,
  D1User,
  D1Staff,
  D1Rider,
  D1MenuItem,
  D1Stats,
} from "@/lib/d1Api";
import { StaffManagement } from "@/components/admin/StaffManagement";
import { RiderManagement } from "@/components/admin/RiderManagement";
import { MenuManagement } from "@/components/admin/MenuManagement";
import { OrderManagement } from "@/components/admin/OrderManagement";
import { ReservationManagement } from "@/components/admin/ReservationManagement";
import { subscribeToOrders, subscribeToBookings, OrderRecord } from "@/services/firebaseDb";
import { toast } from "sonner";

type AdminTab = "orders" | "menu" | "staff" | "riders" | "reservations" | "customers" | "database";

const normalizeOrderItemsList = (items: unknown, itemsJson?: unknown): D1OrderItem[] => {
  let list: unknown = items;
  if ((!list || (Array.isArray(list) && list.length === 0)) && itemsJson) {
    list = itemsJson;
  }
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list.map((it: unknown, idx: number) => {
    const item = (typeof it === "object" && it !== null ? it : {}) as Record<string, unknown>;
    return {
      id: String(item.id || `item-${idx}`),
      name: String(item.name || item.title || item.dishName || `Item #${idx + 1}`),
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 1),
      notes: String(item.notes || item.specialInstructions || ""),
    };
  });
};

const mergeOrdersData = (d1List: D1Order[], fsList: OrderRecord[]): D1Order[] => {
  const map = new Map<string, D1Order>();

  d1List.forEach((o) => {
    if (o && o.id) {
      const orderObj = o as unknown as Record<string, unknown>;
      map.set(o.id, {
        ...o,
        items: normalizeOrderItemsList(o.items, orderObj.itemsJson),
      });
    }
  });

  fsList.forEach((fo) => {
    if (!fo || !fo.id) return;
    const existing = map.get(fo.id);
    const fsItems = normalizeOrderItemsList(fo.items);
    const existingObj = existing as unknown as Record<string, unknown> | undefined;
    const existingItems = existing ? normalizeOrderItemsList(existing.items, existingObj?.itemsJson) : [];
    const finalItems = existingItems.length > 0 ? existingItems : fsItems;

    const converted: D1Order = {
      id: fo.id,
      userId: fo.userId || null,
      customerName: fo.customerName || "Customer",
      phone: fo.phone || "",
      orderType: (fo.orderType === "takeaway" ? "takeaway" : fo.orderType === "delivery" ? "delivery" : "dine_in"),
      subtotal: Number(fo.subtotal || 0),
      deliveryFee: Number(fo.deliveryFee || 0),
      grandTotal: Number(fo.grandTotal || 0),
      address: fo.address || "",
      specialInstructions: fo.specialInstructions || "",
      status: (fo.status === "delivering" ? "out_for_delivery" : fo.status === "completed" ? "delivered" : fo.status) as D1Order["status"],
      items: finalItems,
      riderId: fo.riderId || existing?.riderId,
      riderName: fo.riderName || existing?.riderName,
      riderPhone: fo.riderPhone || existing?.riderPhone,
      createdAt: typeof fo.createdAt === "string" ? fo.createdAt : new Date().toISOString(),
    };

    if (!existing) {
      map.set(fo.id, converted);
    } else {
      map.set(fo.id, {
        ...converted,
        ...existing,
        items: finalItems,
        status: existing.status || converted.status,
      });
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    const tA = new Date(a.createdAt || 0).getTime();
    const tB = new Date(b.createdAt || 0).getTime();
    return tB - tA;
  });
};

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminModal = ({ isOpen, onClose }: AdminModalProps) => {
  const { user, isAdmin, signInWithGoogle, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [d1Orders, setD1Orders] = useState<D1Order[]>([]);
  const [d1Bookings, setD1Bookings] = useState<D1Booking[]>([]);
  const [d1Users, setD1Users] = useState<D1User[]>([]);
  const [d1Staff, setD1Staff] = useState<D1Staff[]>([]);
  const [d1Riders, setD1Riders] = useState<D1Rider[]>([]);
  const [d1Menu, setD1Menu] = useState<D1MenuItem[]>([]);
  const [d1Stats, setD1Stats] = useState<D1Stats | null>(null);
  const [d1Health, setD1Health] = useState<Record<string, unknown> | null>(null);

  const loadD1Data = async () => {
    setIsRefreshing(true);
    try {
      const [orders, bookings, users, staff, riders, menu, stats, health] = await Promise.all([
        fetchD1Orders(),
        fetchD1Bookings(),
        fetchAllD1Users(),
        fetchD1Staff(),
        fetchD1Riders(),
        fetchD1Menu(),
        fetchD1Stats(),
        checkD1Health(),
      ]);

      setD1Orders((prev) => {
        const map = new Map<string, D1Order>();
        prev.forEach((o) => map.set(o.id, o));
        orders.forEach((o) => {
          const existing = map.get(o.id);
          const orderObj = o as unknown as Record<string, unknown>;
          const existingObj = existing as unknown as Record<string, unknown> | undefined;
          const rawIncoming = normalizeOrderItemsList(o.items, orderObj.itemsJson);
          const rawExisting = existing ? normalizeOrderItemsList(existing.items, existingObj?.itemsJson) : [];
          const mergedItems = rawIncoming.length > 0 ? rawIncoming : rawExisting;
          map.set(o.id, {
            ...(existing || {}),
            ...o,
            items: mergedItems,
          });
        });
        return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      });
      setD1Bookings(bookings);
      setD1Users(users);
      setD1Staff(staff);
      setD1Riders(riders);
      setD1Menu(menu);
      setD1Stats(stats);
      setD1Health(health);
    } catch (err) {
      console.error("Failed to load D1 admin data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadD1Data();
      const interval = setInterval(loadD1Data, 20000);

      const unsubOrders = subscribeToOrders((fsOrders) => {
        setD1Orders((prev) => mergeOrdersData(prev, fsOrders));
      });

      const unsubBookings = subscribeToBookings((fsBookings) => {
        setD1Bookings((prev) => {
          const map = new Map<string, D1Booking>();
          prev.forEach((b) => map.set(b.id, b));
          fsBookings.forEach((fb) => {
            if (!fb.id) return;
            const bookingStatus = (fb.status === "cancelled" ? "cancelled" : fb.status === "pending" ? "pending" : "confirmed") as D1Booking["status"];
            map.set(fb.id, {
              id: fb.id,
              userId: fb.userId || null,
              name: fb.name,
              email: fb.email,
              phone: fb.phone,
              guests: fb.guests,
              date: fb.date,
              time: fb.time,
              area: fb.area,
              specialRequests: fb.notes,
              status: bookingStatus,
              createdAt: typeof fb.createdAt === "string" ? fb.createdAt : new Date().toISOString(),
            });
          });
          return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        });
      });

      return () => {
        clearInterval(interval);
        unsubOrders();
        unsubBookings();
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalRevenue = d1Stats?.totalRevenue || d1Orders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
  const activeOrdersCount = d1Orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length;

  const handleOrderUpdated = (updatedOrder: D1Order) => {
    setD1Orders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Admin Dashboard"
      className="fixed inset-0 top-0 left-0 w-screen h-screen flex flex-col p-0 border-0 bg-background overflow-hidden z-40 focus:outline-none select-text"
    >
        {/* Header Bar */}
        <div className="px-4 py-3 sm:px-8 sm:py-4 border-b border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-foreground">The Grill Spot • Kitchen & Dispatch Portal</h1>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30">
                  Real-Time Synced
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-light">
                Live Kitchen & Dispatch command center — Orders, Menu, Delivery, Bookings, and Staff
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadD1Data}
              disabled={isRefreshing}
              className="text-xs h-8 rounded-full gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={onClose}
              className="text-xs h-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Exit Fullscreen Admin
            </Button>
          </div>
        </div>

        {/* Top Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-3 sm:px-8 bg-muted/20 border-b border-border flex-shrink-0">
          <div className="p-3 bg-card rounded-xl border border-border flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Active Orders</p>
              <p className="text-base font-bold text-foreground">{activeOrdersCount}</p>
            </div>
          </div>

          <div className="p-3 bg-card rounded-xl border border-border flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Total Revenue</p>
              <p className="text-base font-bold text-foreground">Rs. {totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          <div className="p-3 bg-card rounded-xl border border-border flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Active Riders</p>
              <p className="text-base font-bold text-foreground">{d1Riders.filter((r) => r.status === "available" || r.status === "busy").length}</p>
            </div>
          </div>

          <div className="p-3 bg-card rounded-xl border border-border flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium">Table Bookings</p>
              <p className="text-base font-bold text-foreground">{d1Bookings.length}</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-4 sm:px-8 py-2.5 border-b border-border bg-card/70 overflow-x-auto flex-shrink-0 scrollbar-none">
          <Button
            variant={activeTab === "orders" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("orders")}
            className="text-xs h-8 rounded-full gap-1.5 font-medium whitespace-nowrap"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Live Orders ({d1Orders.length})
          </Button>

          <Button
            variant={activeTab === "menu" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("menu")}
            className="text-xs h-8 rounded-full gap-1.5 font-medium whitespace-nowrap"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            Menu Catalog ({d1Menu.length || 18})
          </Button>

          <Button
            variant={activeTab === "riders" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("riders")}
            className="text-xs h-8 rounded-full gap-1.5 font-medium whitespace-nowrap"
          >
            <Bike className="w-3.5 h-3.5" />
            Delivery Riders ({d1Riders.length})
          </Button>

          <Button
            variant={activeTab === "staff" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("staff")}
            className="text-xs h-8 rounded-full gap-1.5 font-medium whitespace-nowrap"
          >
            <ChefHat className="w-3.5 h-3.5" />
            Kitchen Staff ({d1Staff.length})
          </Button>

          <Button
            variant={activeTab === "customers" ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab("customers")}
            className="text-xs h-8 rounded-full gap-1.5 font-medium whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5" />
            Customers ({d1Users.length})
          </Button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6 bg-muted/10">
          {activeTab === "orders" && (
            <OrderManagement
              orders={d1Orders}
              ordersList={d1Orders}
              riders={d1Riders}
              ridersList={d1Riders}
              onRefresh={loadD1Data}
              onUpdateOrder={handleOrderUpdated}
            />
          )}

          {activeTab === "menu" && (
            <MenuManagement
              menuItems={d1Menu}
              onRefresh={loadD1Data}
            />
          )}

          {activeTab === "riders" && (
            <RiderManagement
              riders={d1Riders}
              orders={d1Orders}
              onRefresh={loadD1Data}
            />
          )}

          {activeTab === "reservations" && (
            <ReservationManagement
              bookings={d1Bookings}
              onRefresh={loadD1Data}
            />
          )}

          {activeTab === "staff" && (
            <StaffManagement
              staff={d1Staff}
              onRefresh={loadD1Data}
            />
          )}

          {activeTab === "customers" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Registered Customers & Guest Accounts</h3>
                  <p className="text-xs text-muted-foreground font-light">
                    Directory of customers who placed orders or reserved tables
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {d1Users.length > 0 ? (
                  d1Users.map((cust) => (
                    <Card key={cust.id} className="p-4 border-border shadow-soft bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-foreground">{cust.displayName || "Customer"}</p>
                        <Badge variant="outline" className="text-[10px]">
                          {cust.role || "customer"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 flex-shrink-0" /> {cust.email || "No email"}
                      </p>
                      {cust.phone && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Phone className="w-3 h-3 flex-shrink-0" /> {cust.phone}
                        </p>
                      )}
                      {cust.address && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" /> {cust.address}
                        </p>
                      )}
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full p-8 text-center bg-card rounded-xl border border-border">
                    <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-foreground">No customer records yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
};
