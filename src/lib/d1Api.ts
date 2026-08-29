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
}

export interface D1Order {
  id: string;
  userId?: string | null;
  customerName: string;
  phone: string;
  orderType: "delivery" | "pickup" | "dine_in";
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  address: string;
  specialInstructions?: string;
  status: "pending" | "preparing" | "out_for_delivery" | "delivered" | "cancelled";
  items: D1OrderItem[];
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
  status: "confirmed" | "seated" | "completed" | "cancelled";
  createdAt?: string;
  updatedAt?: string;
}

export interface D1Stats {
  totalOrders: number;
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
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

// 4. Stats & Health
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
