// Cloudflare D1 SQL Client-Side Service Interface

export interface D1User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phone: string | null;
  address: string | null;
  favoriteBranch: string | null;
  dietaryPreferences: string | null;
  role: "admin" | "customer";
  createdAt?: string;
  updatedAt?: string;
}

export interface D1OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface D1Order {
  id: string;
  userId?: string | null;
  customerName: string;
  phone: string;
  orderType: "delivery" | "pickup" | "dine_in" | "dinein" | "takeaway";
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  address: string;
  specialInstructions?: string;
  status: "pending" | "preparing" | "out_for_delivery" | "delivered" | "cancelled" | "completed";
  items: D1OrderItem[];
  riderId?: string | null;
  riderName?: string | null;
  riderPhone?: string | null;
  allocatedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface D1Booking {
  id: string;
  userId?: string | null;
  name: string;
  email: string;
  phone: string;
  guests: number;
  date: string;
  time: string;
  area: string;
  specialRequests?: string;
  status: "confirmed" | "seated" | "completed" | "cancelled" | "pending";
  createdAt?: string;
  updatedAt?: string;
}

export interface D1Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string; // "Head Chef" | "Branch Manager" | "Line Cook" | "Host & Cashier" | "Barista" | "Waitstaff"
  branch: string; // "Gulberg III" | "MM Alam Road" | "DHA Phase 5"
  shift: string; // "Morning" | "Evening" | "Night" | "Full Day"
  status: "active" | "on_duty" | "off_duty" | "on_leave";
  salary?: string;
  joinedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface D1Rider {
  id: string;
  name: string;
  phone: string;
  vehicleType: string; // "Motorbike (Honda 125)" | "Motorbike (Yamaha YBR)" | "Scooter (Electric)" | "Car"
  vehiclePlate: string;
  assignedZone: string; // "Gulberg & Main Boulevard" | "DHA Phase 1-6 & Cantt" | "Model Town & Garden Town"
  status: "available" | "delivering" | "on_break" | "offline";
  activeDeliveries: number;
  rating: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface D1MenuItem {
  id: string;
  name: string;
  category: string; // "Smashed Burgers" | "Shawarma" | "Wood-Fired Pizza" | "Charcoal BBQ" | "Sides & Fries" | "Drinks & Shakes"
  price: number;
  description: string;
  image: string;
  features?: string | string[];
  isAvailable: number | boolean; // 1/true or 0/false
  isFeatured?: number | boolean;
  spiceLevel?: string; // "None" | "Mild" | "Medium" | "Hot" | "Extra Spicy"
  prepTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface D1Stats {
  totalOrders: number;
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  totalStaff?: number;
  totalRiders?: number;
  totalMenuItems?: number;
}

// 1. Users
export async function fetchD1User(id: string): Promise<D1User | null> {
  try {
    const res = await fetch(`/api/d1/users/${encodeURIComponent(id)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.success ? data.user : null;
  } catch (err) {
    console.warn("fetchD1User error:", err);
    return null;
  }
}

export async function fetchAllD1Users(): Promise<D1User[]> {
  try {
    const res = await fetch("/api/d1/users");
    const data = await res.json();
    return data.success ? data.users : [];
  } catch (err) {
    console.error("fetchAllD1Users error:", err);
    return [];
  }
}

export async function upsertD1User(user: Partial<D1User> & { id: string }): Promise<D1User | null> {
  try {
    const res = await fetch("/api/d1/users/upsert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });
    const data = await res.json();
    return data.success ? data.user : null;
  } catch (err) {
    console.error("upsertD1User error:", err);
    return null;
  }
}

// 2. Orders
export async function fetchD1Orders(userId?: string): Promise<D1Order[]> {
  try {
    const url = userId ? `/api/d1/orders?userId=${encodeURIComponent(userId)}` : "/api/d1/orders";
    const res = await fetch(url);
    const data = await res.json();
    return data.success ? data.orders : [];
  } catch (err) {
    console.error("fetchD1Orders error:", err);
    return [];
  }
}

export async function createD1Order(order: Partial<D1Order>): Promise<D1Order | null> {
  try {
    const res = await fetch("/api/d1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(order),
    });
    const data = await res.json();
    return data.success ? data.order : null;
  } catch (err) {
    console.error("createD1Order error:", err);
    return null;
  }
}

export async function allocateOrderToRider(
  orderId: string,
  riderId: string,
  riderName: string,
  riderPhone: string,
  status: string = "out_for_delivery"
): Promise<boolean> {
  try {
    const res = await fetch(`/api/d1/orders/${encodeURIComponent(orderId)}/allocate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ riderId, riderName, riderPhone, status }),
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("allocateOrderToRider error:", err);
    return false;
  }
}

export async function updateD1OrderStatus(id: string, status: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/d1/orders/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("updateD1OrderStatus error:", err);
    return false;
  }
}

export async function deleteD1Order(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/d1/orders/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("deleteD1Order error:", err);
    return false;
  }
}

// 3. Bookings
export async function fetchD1Bookings(userId?: string): Promise<D1Booking[]> {
  try {
    const url = userId ? `/api/d1/bookings?userId=${encodeURIComponent(userId)}` : "/api/d1/bookings";
    const res = await fetch(url);
    const data = await res.json();
    return data.success ? data.bookings : [];
  } catch (err) {
    console.error("fetchD1Bookings error:", err);
    return [];
  }
}

export async function createD1Booking(booking: Partial<D1Booking>): Promise<D1Booking | null> {
  try {
    const res = await fetch("/api/d1/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(booking),
    });
    const data = await res.json();
    return data.success ? data.booking : null;
  } catch (err) {
    console.error("createD1Booking error:", err);
    return null;
  }
}

export async function updateD1BookingStatus(id: string, status: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/d1/bookings/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("updateD1BookingStatus error:", err);
    return false;
  }
}

export async function deleteD1Booking(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/d1/bookings/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("deleteD1Booking error:", err);
    return false;
  }
}

// 4. Staff Operations
export async function fetchD1Staff(): Promise<D1Staff[]> {
  try {
    const res = await fetch("/api/d1/staff");
    const data = await res.json();
    return data.success ? data.staff : [];
  } catch (err) {
    console.error("fetchD1Staff error:", err);
    return [];
  }
}

export async function createD1Staff(staff: Partial<D1Staff>): Promise<D1Staff | null> {
  try {
    const res = await fetch("/api/d1/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staff),
    });
    const data = await res.json();
    return data.success ? data.staff : null;
  } catch (err) {
    console.error("createD1Staff error:", err);
    return null;
  }
}

export async function updateD1Staff(id: string, staff: Partial<D1Staff>): Promise<D1Staff | null> {
  try {
    const res = await fetch(`/api/d1/staff/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(staff),
    });
    const data = await res.json();
    return data.success ? data.staff : null;
  } catch (err) {
    console.error("updateD1Staff error:", err);
    return null;
  }
}

export async function deleteD1Staff(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/d1/staff/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("deleteD1Staff error:", err);
    return false;
  }
}

// 5. Riders Operations
export async function fetchD1Riders(): Promise<D1Rider[]> {
  try {
    const res = await fetch("/api/d1/riders");
    const data = await res.json();
    return data.success ? data.riders : [];
  } catch (err) {
    console.error("fetchD1Riders error:", err);
    return [];
  }
}

export async function createD1Rider(rider: Partial<D1Rider>): Promise<D1Rider | null> {
  try {
    const res = await fetch("/api/d1/riders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rider),
    });
    const data = await res.json();
    return data.success ? data.rider : null;
  } catch (err) {
    console.error("createD1Rider error:", err);
    return null;
  }
}

export async function updateD1Rider(id: string, rider: Partial<D1Rider>): Promise<D1Rider | null> {
  try {
    const res = await fetch(`/api/d1/riders/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rider),
    });
    const data = await res.json();
    return data.success ? data.rider : null;
  } catch (err) {
    console.error("updateD1Rider error:", err);
    return null;
  }
}

export async function deleteD1Rider(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/d1/riders/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("deleteD1Rider error:", err);
    return false;
  }
}

// 6. Menu Items Operations
export async function fetchD1Menu(): Promise<D1MenuItem[]> {
  try {
    const res = await fetch("/api/d1/menu");
    const data = await res.json();
    return data.success ? data.menu : [];
  } catch (err) {
    console.error("fetchD1Menu error:", err);
    return [];
  }
}

export async function createD1MenuItem(item: Partial<D1MenuItem>): Promise<D1MenuItem | null> {
  try {
    const res = await fetch("/api/d1/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    return data.success ? data.item : null;
  } catch (err) {
    console.error("createD1MenuItem error:", err);
    return null;
  }
}

export async function updateD1MenuItem(id: string, item: Partial<D1MenuItem>): Promise<D1MenuItem | null> {
  try {
    const res = await fetch(`/api/d1/menu/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    return data.success ? data.item : null;
  } catch (err) {
    console.error("updateD1MenuItem error:", err);
    return null;
  }
}

export async function deleteD1MenuItem(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/d1/menu/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("deleteD1MenuItem error:", err);
    return false;
  }
}

// 7. Stats & Health
export async function fetchD1Stats(): Promise<D1Stats | null> {
  try {
    const res = await fetch("/api/d1/stats");
    const data = await res.json();
    return data.success ? data.stats : null;
  } catch (err) {
    console.error("fetchD1Stats error:", err);
    return null;
  }
}

export async function checkD1Health(): Promise<{ status: string; database?: string; usersCount?: number } | null> {
  try {
    const res = await fetch("/api/d1/health");
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("checkD1Health error:", err);
    return null;
  }
}
