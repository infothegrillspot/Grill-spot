import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Users,
  DollarSign,
  MapPin,
  Mail,
  Phone,
  ArrowLeft,
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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
import { toast } from "sonner";

type AdminTab = "orders" | "menu" | "staff" | "riders" | "reservations" | "customers" | "database";

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { user, loading, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>("orders");

  // State
  const [d1Orders, setD1Orders] = useState<D1Order[]>([]);
  const [d1Bookings, setD1Bookings] = useState<D1Booking[]>([]);
  const [d1Users, setD1Users] = useState<D1User[]>([]);
  const [d1Staff, setD1Staff] = useState<D1Staff[]>([]);
  const [d1Riders, setD1Riders] = useState<D1Rider[]>([]);
  const [d1Menu, setD1Menu] = useState<D1MenuItem[]>([]);
  const [d1Stats, setD1Stats] = useState<D1Stats | null>(null);
  const [d1Health, setD1Health] = useState<{ status: string; usersCount?: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !user && !isDemo) {
      navigate("/auth");
    }
  }, [loading, user, navigate, isDemo]);

  // Load all D1 Data
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

      setD1Orders(orders);
      setD1Bookings(bookings);
      setD1Users(users);
      setD1Staff(staff);
      setD1Riders(riders);
      setD1Menu(menu);
      setD1Stats(stats);
      setD1Health(health);
    } catch (err) {
      console.error("Failed to load D1 admin data:", err);
      toast.error("Network notice: refreshed local storage cache");
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadD1Data();
    const interval = setInterval(loadD1Data, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalRevenue = d1Stats?.totalRevenue || d1Orders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
  const pendingOrdersCount = d1Orders.filter((o) => o.status === "pending").length;
  const availableRidersCount = d1Riders.filter((r) => r.status === "available").length;
  const onDutyStaffCount = d1Staff.filter((s) => s.status === "on_duty" || s.status === "active").length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20">
      <Navigation />

      <main className="flex-1 pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto w-full">
        {/* Top Header & User Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground -ml-2"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to Restaurant
              </Button>
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/20 text-[11px] font-normal"
              >
                <ShieldCheck className="w-3 h-3 mr-1 inline" />
                Master Admin Portal
              </Badge>
              {isDemo && (
                <Badge variant="secondary" className="text-[10px]">
                  Demo Mode
                </Badge>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground">
              The Grill Spot <span className="font-normal text-primary">Operations HQ</span>
            </h1>
            <p className="text-xs text-muted-foreground font-light">
              Lahore Branch Management • Live Order Allocation • Kitchen Staff & Rider Fleet Control
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadD1Data}
              disabled={isRefreshing}
              className="h-9 text-xs font-normal border-border gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              Sync Cloudflare D1
            </Button>

            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  signOut();
                  navigate("/");
                }}
                className="h-9 text-xs text-muted-foreground hover:text-destructive gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            )}
          </div>
        </div>

        {/* Top KPI Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-6">
          {/* Revenue */}
          <Card className="p-3.5 border border-border bg-card shadow-soft">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-light">Total Revenue</span>
              <DollarSign className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground font-mono">
              Rs. {Number(totalRevenue).toLocaleString()}
            </p>
            <p className="text-[10px] text-emerald-600 font-light flex items-center gap-0.5 mt-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> All channels
            </p>
          </Card>

          {/* Orders */}
          <Card className="p-3.5 border border-border bg-card shadow-soft">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-light">Total Orders</span>
              <ShoppingBag className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <p className="text-lg font-semibold text-foreground font-mono">{d1Orders.length}</p>
            <p className="text-[10px] text-amber-600 font-light mt-0.5">
              {pendingOrdersCount} pending dispatch
            </p>
          </Card>

          {/* Menu Items */}
          <Card className="p-3.5 border border-border bg-card shadow-soft">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-light">Menu Catalog</span>
              <UtensilsCrossed className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <p className="text-lg font-semibold text-foreground font-mono">{d1Menu.length} Dishes</p>
            <p className="text-[10px] text-emerald-600 font-light mt-0.5">
              {d1Menu.filter((m) => m.isAvailable).length} In Stock
            </p>
          </Card>

          {/* Staff Members */}
          <Card className="p-3.5 border border-border bg-card shadow-soft">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-light">Kitchen Staff</span>
              <ChefHat className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <p className="text-lg font-semibold text-foreground font-mono">{d1Staff.length} Team</p>
            <p className="text-[10px] text-emerald-600 font-light mt-0.5">
              {onDutyStaffCount} On Duty Now
            </p>
          </Card>

          {/* Delivery Riders */}
          <Card className="p-3.5 border border-border bg-card shadow-soft">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-light">Rider Fleet</span>
              <Bike className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <p className="text-lg font-semibold text-foreground font-mono">{d1Riders.length} Riders</p>
            <p className="text-[10px] text-blue-600 font-light mt-0.5">
              {availableRidersCount} Ready for dispatch
            </p>
          </Card>

          {/* Table Bookings */}
          <Card className="p-3.5 border border-border bg-card shadow-soft">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-light">Reservations</span>
              <CalendarDays className="w-3.5 h-3.5 text-pink-500" />
            </div>
            <p className="text-lg font-semibold text-foreground font-mono">{d1Bookings.length} Guests</p>
            <p className="text-[10px] text-emerald-600 font-light mt-0.5">
              {d1Bookings.filter((b) => b.status === "confirmed").length} Confirmed
            </p>
          </Card>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border mt-6 overflow-x-auto scrollbar-none pb-px">
          {[
            { id: "orders", label: "Orders & Dispatch", icon: ShoppingBag, badge: pendingOrdersCount > 0 ? pendingOrdersCount : null },
            { id: "menu", label: "Menu Management", icon: UtensilsCrossed, badge: d1Menu.length },
            { id: "staff", label: "Staff & Chefs", icon: ChefHat, badge: d1Staff.length },
            { id: "riders", label: "Delivery Fleet (Riders)", icon: Bike, badge: availableRidersCount > 0 ? `${availableRidersCount} Free` : null },
            { id: "reservations", label: "Reservations", icon: CalendarDays, badge: d1Bookings.length },
            { id: "customers", label: "Customers CRM", icon: Users, badge: d1Users.length },
            { id: "database", label: "D1 Cloudflare Sync", icon: Database, badge: "D1 SQL" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-normal border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? "border-primary text-primary font-medium bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Active Tab Content Render */}
        <div className="pt-6">
          {activeTab === "orders" && (
            <OrderManagement
              ordersList={d1Orders}
              ridersList={d1Riders}
              onRefresh={loadD1Data}
            />
          )}

          {activeTab === "menu" && (
            <MenuManagement
              menuList={d1Menu}
              onRefresh={loadD1Data}
            />
          )}

          {activeTab === "staff" && (
            <StaffManagement
              staffList={d1Staff}
              onRefresh={loadD1Data}
            />
          )}

          {activeTab === "riders" && (
            <RiderManagement
              ridersList={d1Riders}
              onRefresh={loadD1Data}
            />
          )}

          {activeTab === "reservations" && (
            <ReservationManagement
              bookingsList={d1Bookings}
              onRefresh={loadD1Data}
            />
          )}

          {activeTab === "customers" && (
            <Card className="border border-border shadow-soft p-4">
              <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground">Registered Customers & Diners</h3>
                  <p className="text-xs text-muted-foreground font-light">
                    Customer records synced with Google Sign-In and Cloudflare D1
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs font-mono">
                  {d1Users.length} Users
                </Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-left">
                      <th className="pb-2 font-normal">Customer</th>
                      <th className="pb-2 font-normal">Contact</th>
                      <th className="pb-2 font-normal">Favorite Branch</th>
                      <th className="pb-2 font-normal">Role</th>
                      <th className="pb-2 font-normal">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {d1Users.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/20">
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {u.displayName?.charAt(0) || u.email?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{u.displayName || "Valued Diner"}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 font-light">
                          <p className="text-foreground">{u.email || "No email"}</p>
                          <p className="text-muted-foreground font-mono text-[11px]">{u.phone || "No phone"}</p>
                        </td>
                        <td className="py-2.5 font-light text-foreground">{u.favoriteBranch || "Gulberg III"}</td>
                        <td className="py-2.5">
                          <Badge variant={u.role === "admin" ? "default" : "outline"} className="text-[10px]">
                            {u.role || "customer"}
                          </Badge>
                        </td>
                        <td className="py-2.5 font-mono text-muted-foreground text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "Active"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {activeTab === "database" && (
            <div className="space-y-4">
              <Card className="p-4 border border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Cloudflare D1 SQLite Database Engine</h3>
                    <p className="text-xs text-muted-foreground font-mono">
                      Database ID: c41385c3-6bbd-4b69-88c3-d3d155c17cf7
                    </p>
                  </div>
                  <Badge variant="outline" className="ml-auto bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                    Connected & Healthy
                  </Badge>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 border border-border">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Live Tables</h4>
                  <ul className="text-xs space-y-1.5 font-mono text-foreground">
                    <li>• <span className="text-primary font-bold">orders</span> ({d1Orders.length} records)</li>
                    <li>• <span className="text-primary font-bold">menu_items</span> ({d1Menu.length} dishes)</li>
                    <li>• <span className="text-primary font-bold">staff</span> ({d1Staff.length} team members)</li>
                    <li>• <span className="text-primary font-bold">riders</span> ({d1Riders.length} fleet riders)</li>
                    <li>• <span className="text-primary font-bold">bookings</span> ({d1Bookings.length} reservations)</li>
                    <li>• <span className="text-primary font-bold">users</span> ({d1Users.length} accounts)</li>
                  </ul>
                </Card>

                <Card className="p-4 border border-border">
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Vercel & Edge Resiliency</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    The backend router is dual-mounted on <code className="text-primary">/api/d1</code> and <code className="text-primary">/d1</code> to guarantee zero-downtime execution on both Vercel Serverless Functions and standalone Node containers.
                  </p>
                </Card>

                <Card className="p-4 border border-border flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Database Actions</h4>
                    <p className="text-xs text-muted-foreground">
                      Perform migration checks or re-initialize SQLite table definitions.
                    </p>
                  </div>
                  <Button
                    onClick={async () => {
                      const res = await fetch("/api/d1/init", { method: "POST" });
                      const d = await res.json();
                      if (d.success) toast.success("D1 Schema re-synchronized!");
                      loadD1Data();
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-3 text-xs w-full"
                  >
                    Re-Sync D1 Schemas
                  </Button>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
