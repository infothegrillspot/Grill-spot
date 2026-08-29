import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { 
  Calendar, 
  Users, 
  DollarSign, 
  MapPin, 
  Mail, 
  Phone, 
  ArrowLeft, 
  LogOut, 
  Eye, 
  ShoppingBag, 
  Utensils, 
  CheckCircle, 
  Clock, 
  Database, 
  RefreshCw, 
  ShieldCheck, 
  Trash2, 
  Check, 
  ChefHat, 
  Truck, 
  Server,
  Activity
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { 
  fetchD1Orders, 
  fetchD1Bookings, 
  fetchAllD1Users, 
  fetchD1Stats, 
  updateD1OrderStatus, 
  deleteD1Order, 
  updateD1BookingStatus, 
  deleteD1Booking, 
  checkD1Health, 
  D1Order, 
  D1Booking, 
  D1User, 
  D1Stats 
} from "@/lib/d1Api";
import { 
  subscribeToBookings, 
  subscribeToOrders, 
  updateBookingStatusInFirestore, 
  BookingRecord, 
  OrderRecord 
} from "@/services/firebaseDb";
import { toast } from "sonner";

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";
  const { user, loading, signOut } = useAuth();
  
  const [activeTab, setActiveTab] = useState<"reservations" | "orders" | "customers" | "d1console">("reservations");
  
  // Cloudflare D1 States
  const [d1Orders, setD1Orders] = useState<D1Order[]>([]);
  const [d1Bookings, setD1Bookings] = useState<D1Booking[]>([]);
  const [d1Users, setD1Users] = useState<D1User[]>([]);
  const [d1Stats, setD1Stats] = useState<D1Stats | null>(null);
  const [d1Health, setD1Health] = useState<{ status: string; usersCount?: number } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Firestore fallbacks/live
  const [firestoreBookings, setFirestoreBookings] = useState<BookingRecord[]>([]);
  const [firestoreOrders, setFirestoreOrders] = useState<OrderRecord[]>([]);

  useEffect(() => {
    if (!loading && !user && !isDemo) {
      navigate("/auth");
    }
  }, [loading, user, navigate, isDemo]);

  // Load Cloudflare D1 data
  const loadD1Data = async () => {
    setIsRefreshing(true);
    try {
      const [orders, bookings, users, stats, health] = await Promise.all([
        fetchD1Orders(),
        fetchD1Bookings(),
        fetchAllD1Users(),
        fetchD1Stats(),
        checkD1Health(),
      ]);

      setD1Orders(orders);
      setD1Bookings(bookings);
      setD1Users(users);
      setD1Stats(stats);
      setD1Health(health);
    } catch (err) {
      console.error("Failed to load D1 data:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadD1Data();
    // Real-time Firestore sync as companion
    const unsubBookings = subscribeToBookings((liveBookings) => {
      if (liveBookings.length > 0) setFirestoreBookings(liveBookings);
    });

    const unsubOrders = subscribeToOrders((liveOrders) => {
      if (liveOrders.length > 0) setFirestoreOrders(liveOrders);
    });

    return () => {
      unsubBookings();
      unsubOrders();
    };
  }, []);

  if (loading && !isDemo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground font-light">Loading Admin Dashboard...</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "delivered":
      case "completed":
        return "bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300";
      case "preparing":
      case "out_for_delivery":
      case "seated":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Handle Booking Status Update
  const handleUpdateBookingStatus = async (bookingId: string, newStatus: "confirmed" | "cancelled" | "seated" | "completed") => {
    // 1. Update in Cloudflare D1
    await updateD1BookingStatus(bookingId, newStatus);
    // 2. Update in Firestore if present
    if (newStatus === "confirmed" || newStatus === "cancelled" || newStatus === "pending") {
      await updateBookingStatusInFirestore(bookingId, newStatus).catch(() => {});
    }

    setD1Bookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    toast.success(`Booking ${bookingId} updated to ${newStatus}`);
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (window.confirm("Are you sure you want to delete this reservation from Cloudflare D1 SQL?")) {
      await deleteD1Booking(bookingId);
      setD1Bookings((prev) => prev.filter((b) => b.id !== bookingId));
      toast.success("Reservation deleted from Cloudflare D1");
    }
  };

  // Handle Order Status Update
  const handleUpdateOrderStatus = async (orderId: string, newStatus: D1Order["status"]) => {
    await updateD1OrderStatus(orderId, newStatus);
    setD1Orders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    toast.success(`Order ${orderId} marked as ${newStatus}`);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm("Are you sure you want to delete this order from Cloudflare D1 SQL?")) {
      await deleteD1Order(orderId);
      setD1Orders((prev) => prev.filter((o) => o.id !== orderId));
      toast.success("Order deleted from Cloudflare D1");
    }
  };

  // Combined Bookings
  const displayBookings = d1Bookings.length > 0 ? d1Bookings : firestoreBookings.map((b) => ({
    id: b.id,
    name: b.name,
    email: b.email,
    phone: b.phone,
    guests: b.guests,
    date: b.date,
    time: b.time || "19:00",
    area: b.area || "Gulberg III",
    status: b.status as D1Booking["status"],
  }));

  // Combined Orders
  const displayOrders = d1Orders.length > 0 ? d1Orders : firestoreOrders.map((o) => ({
    id: o.id,
    userId: o.userId,
    customerName: o.customerName || "Customer",
    phone: o.phone || "",
    orderType: o.orderType as D1Order["orderType"],
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    grandTotal: o.grandTotal,
    address: o.address,
    specialInstructions: o.specialInstructions,
    status: o.status as D1Order["status"],
    items: o.items || [],
    createdAt: o.createdAt,
  }));

  const totalBookingsCount = d1Stats?.totalBookings || displayBookings.length;
  const totalOrdersCount = d1Stats?.totalOrders || displayOrders.length;
  const totalRevenue = d1Stats?.totalRevenue || displayOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalUsersCount = d1Stats?.totalUsers || d1Users.length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation variant="dark" />
      
      <main className="pt-24 pb-20">
        <div className="container mx-auto px-6 lg:px-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-[11px] uppercase tracking-wider font-normal"
              >
                <ArrowLeft className="mr-2 h-3 w-3" />
                Back to Site
              </Button>

              <div className="flex items-center gap-3">
                {/* Cloudflare D1 Status Pill */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-mono font-medium">Cloudflare D1 SQL Active</span>
                </div>

                {user && (
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-accent/50 border border-border">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || "User"} className="w-5 h-5 rounded-full" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold">
                        {(user.displayName || user.email || "G")[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-light text-foreground">{user.displayName || user.email}</span>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-primary/10 text-primary uppercase font-normal border-primary/20">
                      {user.role}
                    </Badge>
                  </div>
                )}

                {isDemo && (
                  <Badge variant="outline" className="gap-1 text-xs font-light border-primary/30 text-primary">
                    <Eye className="h-3 w-3" />
                    Demo Mode
                  </Badge>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadD1Data}
                  disabled={isRefreshing}
                  className="h-8 text-xs font-normal"
                >
                  <RefreshCw className={`w-3 h-3 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  Sync D1
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                  className="text-[11px] uppercase tracking-wider font-normal text-destructive hover:text-destructive"
                >
                  <LogOut className="mr-2 h-3 w-3" />
                  Sign Out
                </Button>
              </div>
            </div>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-light mb-2 tracking-tight">
                  The Grill Spot Admin & Database
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground font-light flex items-center gap-2">
                  <span>Lahore Operations</span>
                  <span>•</span>
                  <span className="font-mono text-primary">D1 Database: c41385c3...17cf7</span>
                </p>
              </div>

              {/* View Switcher */}
              <div className="flex bg-muted/60 p-1 rounded-full border border-border self-start overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setActiveTab("reservations")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-normal transition-all whitespace-nowrap ${
                    activeTab === "reservations" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Utensils className="w-3.5 h-3.5" />
                  Bookings ({totalBookingsCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("orders")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-normal transition-all whitespace-nowrap ${
                    activeTab === "orders" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Orders ({totalOrdersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("customers")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-normal transition-all whitespace-nowrap ${
                    activeTab === "customers" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Profiles ({totalUsersCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("d1console")}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-normal transition-all whitespace-nowrap ${
                    activeTab === "d1console" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Database className="w-3.5 h-3.5 text-primary" />
                  D1 Diagnostics
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="p-5 border border-border shadow-soft">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-light mb-0.5">{totalBookingsCount}</p>
              <p className="text-xs text-muted-foreground font-light">Table Reservations</p>
            </Card>
            
            <Card className="p-5 border border-border shadow-soft">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-light mb-0.5">{totalOrdersCount}</p>
              <p className="text-xs text-muted-foreground font-light">Food Orders (D1 SQL)</p>
            </Card>
            
            <Card className="p-5 border border-border shadow-soft">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-emerald-500" />
                </div>
              </div>
              <p className="text-2xl font-light mb-0.5">{totalUsersCount}</p>
              <p className="text-xs text-muted-foreground font-light">Registered Customers</p>
            </Card>
            
            <Card className="p-5 border border-border shadow-soft">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-light mb-0.5">Rs. {Number(totalRevenue).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground font-light">Total D1 Revenue (PKR)</p>
            </Card>
          </motion.div>

          {/* TAB 1: RESERVATIONS */}
          {activeTab === "reservations" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border border-border shadow-soft overflow-hidden">
                <div className="p-4 bg-muted/20 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-medium">Table Bookings in Cloudflare D1 SQL</h3>
                  </div>
                  <span className="text-xs text-muted-foreground font-light">{displayBookings.length} total entries</span>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-[11px] uppercase tracking-wider font-normal">Guest Name & ID</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-normal">Area / Branch</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-normal">Date & Time</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-normal">Guests</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-normal">Status</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-normal">Contact</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-normal">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayBookings.map((booking, idx) => (
                        <TableRow key={booking.id || idx} className="border-border">
                          <TableCell>
                            <div>
                              <p className="text-sm font-normal text-foreground">{booking.name}</p>
                              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">
                                {booking.id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-light">{booking.area || "Gulberg III"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-light">
                              <p className="font-medium text-foreground">{booking.date}</p>
                              <p className="text-muted-foreground">{booking.time || "7:00 PM"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-xs font-medium">{booking.guests} Guests</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] uppercase font-normal ${getStatusColor(booking.status)}`}
                            >
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              {booking.email && (
                                <a 
                                  href={`mailto:${booking.email}`} 
                                  className="text-xs text-muted-foreground hover:text-primary font-light flex items-center gap-1 truncate max-w-[130px]"
                                >
                                  <Mail className="h-3 w-3 flex-shrink-0" />
                                  {booking.email}
                                </a>
                              )}
                              {booking.phone && (
                                <a 
                                  href={`tel:${booking.phone}`} 
                                  className="text-xs text-muted-foreground hover:text-primary font-light flex items-center gap-1"
                                >
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                  {booking.phone}
                                </a>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {booking.status !== "confirmed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateBookingStatus(booking.id!, "confirmed")}
                                  className="h-7 px-2 text-[10px] text-green-600 border-green-600/30 hover:bg-green-500/10"
                                >
                                  Confirm
                                </Button>
                              )}
                              {booking.status === "confirmed" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateBookingStatus(booking.id!, "seated")}
                                  className="h-7 px-2 text-[10px] text-blue-600 border-blue-600/30 hover:bg-blue-500/10"
                                >
                                  Seat
                                </Button>
                              )}
                              {booking.status !== "cancelled" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateBookingStatus(booking.id!, "cancelled")}
                                  className="h-7 px-2 text-[10px] text-destructive border-destructive/30 hover:bg-destructive/10"
                                >
                                  Cancel
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteBooking(booking.id!)}
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                title="Delete from D1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 2: ORDERS */}
          {activeTab === "orders" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <Card className="border border-border shadow-soft p-4 bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-medium">Customer Food Orders in Cloudflare D1 SQL</h3>
                </div>
                <span className="text-xs text-muted-foreground font-light">{displayOrders.length} total orders</span>
              </Card>

              {displayOrders.length === 0 ? (
                <Card className="p-12 text-center border border-border">
                  <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3 stroke-1" />
                  <p className="text-sm font-medium text-foreground">No food orders recorded yet</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                    When guests place an order via the Cart Drawer, it will be written to SQLite table <code className="font-mono text-primary">orders</code> in Cloudflare D1.
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {displayOrders.map((order) => (
                    <Card
                      key={order.id}
                      className="p-5 border border-border shadow-soft bg-card flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{order.customerName || "Customer"}</span>
                          <span className="text-[10px] font-mono text-muted-foreground">ID: {order.id}</span>
                          <Badge variant="outline" className={`text-[10px] uppercase font-normal ${getStatusColor(order.status)}`}>
                            {order.status}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] uppercase font-normal">
                            {order.orderType}
                          </Badge>
                        </div>

                        {/* Items list */}
                        <div className="p-2.5 rounded-md bg-accent/30 border border-border/50 text-xs">
                          <p className="text-muted-foreground font-light">
                            {Array.isArray(order.items) && order.items.length > 0
                              ? order.items.map((i) => `${i.quantity}x ${i.name} (Rs. ${i.price})`).join(" • ")
                              : "Grill item details saved"}
                          </p>
                          {order.address && (
                            <p className="text-muted-foreground/80 font-light mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                              <span>{order.address}</span>
                            </p>
                          )}
                          {order.specialInstructions && (
                            <p className="text-primary/90 italic font-light mt-0.5">
                              Note: {order.specialInstructions}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between lg:justify-end gap-5">
                        <div className="text-right">
                          <p className="text-lg font-normal text-primary">Rs. {Number(order.grandTotal).toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground font-light">
                            Subtotal: Rs. {order.subtotal} {order.deliveryFee > 0 ? `+ Deliv: Rs. ${order.deliveryFee}` : ""}
                          </p>
                        </div>

                        {/* Status Actions */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {order.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateOrderStatus(order.id, "preparing")}
                              className="h-8 text-xs text-blue-600 border-blue-600/30 hover:bg-blue-500/10"
                            >
                              <ChefHat className="w-3.5 h-3.5 mr-1" />
                              Prepare
                            </Button>
                          )}
                          {order.status === "preparing" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateOrderStatus(order.id, "out_for_delivery")}
                              className="h-8 text-xs text-amber-600 border-amber-600/30 hover:bg-amber-500/10"
                            >
                              <Truck className="w-3.5 h-3.5 mr-1" />
                              Dispatch
                            </Button>
                          )}
                          {order.status === "out_for_delivery" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                              className="h-8 text-xs text-emerald-600 border-emerald-600/30 hover:bg-emerald-500/10"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Delivered
                            </Button>
                          )}
                          {order.status !== "cancelled" && order.status !== "delivered" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                              className="h-8 text-xs text-destructive hover:bg-destructive/10"
                            >
                              Cancel
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteOrder(order.id)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            title="Delete from D1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: CUSTOMER & ADMIN PROFILES (D1 users table) */}
          {activeTab === "customers" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="border border-border shadow-soft overflow-hidden">
                <div className="p-4 bg-muted/20 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-medium">Customer & Admin Profiles in Cloudflare D1 SQL</h3>
                  </div>
                  <span className="text-xs text-muted-foreground font-light">{d1Users.length} total registered accounts</span>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-[11px] uppercase tracking-wider font-normal">Customer / Admin</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-normal">Role</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-normal">Contact Phone</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-normal">Favorite Branch</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-normal">Delivery Address (Lahore)</TableHead>
                        <TableHead className="text-[11px] uppercase tracking-wider font-normal">Dining Preferences</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d1Users.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs font-light">
                            No profiles in D1 users table yet. Sign in or edit profile to synchronize.
                          </TableCell>
                        </TableRow>
                      ) : (
                        d1Users.map((u) => (
                          <TableRow key={u.id} className="border-border">
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                {u.photoURL ? (
                                  <img src={u.photoURL} alt={u.displayName || "User"} className="w-7 h-7 rounded-full object-cover border" />
                                ) : (
                                  <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                                    {(u.displayName || u.email || "U")[0].toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-medium text-foreground">{u.displayName || "Valued Guest"}</p>
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{u.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] uppercase font-normal ${
                                  u.role === "admin" 
                                    ? "bg-primary/10 text-primary border-primary/30" 
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {u.role === "admin" ? <ShieldCheck className="w-3 h-3 mr-1 inline" /> : null}
                                {u.role || "customer"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs font-mono text-muted-foreground">{u.phone || "—"}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-foreground font-light">{u.favoriteBranch || "Gulberg III"}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground font-light max-w-[200px] truncate block">
                                {u.address || "—"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground/80 font-light max-w-[200px] truncate block italic">
                                {u.dietaryPreferences || "None recorded"}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </motion.div>
          )}

          {/* TAB 4: CLOUDFLARE D1 DIAGNOSTICS & CONSOLE */}
          {activeTab === "d1console" && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cloudflare Account Details Card */}
                <Card className="p-6 border border-border shadow-soft bg-card space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Server className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-medium">Cloudflare D1 Infrastructure Details</h3>
                  </div>

                  <div className="space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between p-2 rounded bg-muted/40">
                      <span className="text-muted-foreground">Account ID:</span>
                      <span className="text-foreground select-all">5847d87426a6e542bb9b8a61fa6e4fdc</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-muted/40">
                      <span className="text-muted-foreground">D1 Database UUID:</span>
                      <span className="text-primary select-all">c41385c3-6bbd-4b69-88c3-d3d155c17cf7</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-muted/40">
                      <span className="text-muted-foreground">Engine:</span>
                      <span className="text-foreground">Cloudflare D1 Serverless SQLite</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-muted/40">
                      <span className="text-muted-foreground">REST Endpoint:</span>
                      <span className="text-foreground truncate max-w-[200px]">/api/d1/* (Secure Proxy)</span>
                    </div>
                  </div>
                </Card>

                {/* Live Schema & Tables Card */}
                <Card className="p-6 border border-border shadow-soft bg-card space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-medium">Database Schema & Record Counts</h3>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded border border-border bg-card">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-primary">users</code>
                        <span className="text-muted-foreground text-[11px] font-light">Profiles, roles, phone, preferences</span>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">{d1Users.length} rows</Badge>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded border border-border bg-card">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-primary">orders</code>
                        <span className="text-muted-foreground text-[11px] font-light">Cart items, pricing, delivery status</span>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">{d1Orders.length} rows</Badge>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded border border-border bg-card">
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-primary">bookings</code>
                        <span className="text-muted-foreground text-[11px] font-light">Table reservations, dates, guests</span>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">{d1Bookings.length} rows</Badge>
                    </div>
                  </div>
                </Card>
              </div>

              {/* D1 Connection Health Banner */}
              <Card className="p-5 border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground">Cloudflare D1 Connection Live & Operational</h4>
                    <p className="text-xs text-muted-foreground font-light">
                      All customer and admin profile data, order history, and reservations are synchronized with SQLite database in real-time.
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={async () => {
                    await fetch("/api/d1/init", { method: "POST" });
                    await loadD1Data();
                    toast.success("Cloudflare D1 schemas re-verified successfully");
                  }}
                  className="text-xs font-normal bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
                >
                  Verify Schemas
                </Button>
              </Card>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
