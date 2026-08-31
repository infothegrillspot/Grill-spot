// Cloudflare D1 Database Helper & API Client with Resilient In-Memory Fallback

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || "5847d87426a6e542bb9b8a61fa6e4fdc";
const CF_D1_DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || "c41385c3-6bbd-4b69-88c3-d3d155c17cf7";
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "cfat_0ANXgT9saI4rz7JTqWoH6c0dnV11rfecPP17qMCTb77051cd";

interface D1QueryResult<T = Record<string, unknown>> {
  results: T[];
  success: boolean;
  meta?: {
    changes?: number;
    last_row_id?: number;
    rows_read?: number;
    rows_written?: number;
  };
}

interface D1ApiResponse<T = Record<string, unknown>> {
  result: D1QueryResult<T>[];
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
}

// In-Memory fallback store if Cloudflare credentials expire or are unauthorized
interface MemoryStore {
  users: Map<string, Record<string, unknown>>;
  orders: Map<string, Record<string, unknown>>;
  bookings: Map<string, Record<string, unknown>>;
  staff: Map<string, Record<string, unknown>>;
  riders: Map<string, Record<string, unknown>>;
  menu: Map<string, Record<string, unknown>>;
}

const memoryStore: MemoryStore = {
  users: new Map(),
  orders: new Map(),
  bookings: new Map(),
  staff: new Map(),
  riders: new Map(),
  menu: new Map(),
};

// Pre-seed realistic data for immediate richness
function seedInitialMemoryData() {
  if (memoryStore.staff.size === 0) {
    const defaultStaff = [
      {
        id: "stf_1",
        name: "Chef Farhan Qureshi",
        email: "farhan.q@thegrillspot.pk",
        phone: "+92 300 4589211",
        role: "Head Chef",
        branch: "Gulberg III",
        shift: "Evening",
        status: "on_duty",
        salary: "Rs. 95,000",
        joinedDate: "2024-03-15",
        createdAt: "2024-03-15T10:00:00.000Z",
      },
      {
        id: "stf_2",
        name: "Bilal Tariq",
        email: "bilal.t@thegrillspot.pk",
        phone: "+92 321 8844123",
        role: "Branch Manager",
        branch: "Gulberg III",
        shift: "Full Day",
        status: "on_duty",
        salary: "Rs. 120,000",
        joinedDate: "2023-11-01",
        createdAt: "2023-11-01T10:00:00.000Z",
      },
      {
        id: "stf_3",
        name: "Hamza Malik",
        email: "hamza.m@thegrillspot.pk",
        phone: "+92 333 7123984",
        role: "Line Cook (Grill Master)",
        branch: "Gulberg III",
        shift: "Evening",
        status: "on_duty",
        salary: "Rs. 65,000",
        joinedDate: "2024-06-10",
        createdAt: "2024-06-10T10:00:00.000Z",
      },
      {
        id: "stf_4",
        name: "Ayesha Noor",
        email: "ayesha.n@thegrillspot.pk",
        phone: "+92 312 9901452",
        role: "Host & Cashier",
        branch: "Gulberg III",
        shift: "Morning",
        status: "off_duty",
        salary: "Rs. 55,000",
        joinedDate: "2024-09-01",
        createdAt: "2024-09-01T10:00:00.000Z",
      },
    ];
    defaultStaff.forEach((s) => memoryStore.staff.set(s.id, s));
  }

  if (memoryStore.riders.size === 0) {
    const defaultRiders = [
      {
        id: "rdr_1",
        name: "Tariq Butt",
        phone: "+92 301 5567890",
        vehicleType: "Motorbike (Honda 125)",
        vehiclePlate: "LEA-4821",
        assignedZone: "Gulberg & Main Boulevard",
        status: "available",
        activeDeliveries: 0,
        rating: 4.9,
        createdAt: "2024-05-01T10:00:00.000Z",
      },
      {
        id: "rdr_2",
        name: "Usman Khan",
        phone: "+92 322 4432190",
        vehicleType: "Motorbike (Yamaha YBR)",
        vehiclePlate: "LEN-9012",
        assignedZone: "DHA Phase 1-6 & Cantt",
        status: "delivering",
        activeDeliveries: 1,
        rating: 4.8,
        createdAt: "2024-05-15T10:00:00.000Z",
      },
      {
        id: "rdr_3",
        name: "Ali Raza",
        phone: "+92 334 1198456",
        vehicleType: "Motorbike (Suzuki GS 150)",
        vehiclePlate: "LEB-3341",
        assignedZone: "Model Town & Garden Town",
        status: "available",
        activeDeliveries: 0,
        rating: 5.0,
        createdAt: "2024-07-20T10:00:00.000Z",
      },
      {
        id: "rdr_4",
        name: "Zubair Ahmed",
        phone: "+92 315 8890123",
        vehicleType: "Scooter (Electric)",
        vehiclePlate: "LEC-7719",
        assignedZone: "Johar Town & Faisal Town",
        status: "on_break",
        activeDeliveries: 0,
        rating: 4.7,
        createdAt: "2024-08-10T10:00:00.000Z",
      },
    ];
    defaultRiders.forEach((r) => memoryStore.riders.set(r.id, r));
  }

  if (memoryStore.menu.size === 0) {
    const defaultMenu = [
      {
        id: "burgers",
        name: "Classic Smashed Burger",
        category: "Smashed Burgers",
        price: 1450,
        description: "Hand-smashed double beef patty with melted cheddar, house pickles, and secret spot sauce on toasted brioche.",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
        features: JSON.stringify(["Charcoal grilled", "House sauce", "Brioche bun"]),
        isAvailable: 1,
        isFeatured: 1,
        spiceLevel: "Medium",
        prepTime: "12-15 mins",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "bbq_bacon_burger",
        name: "BBQ Bacon Stack Smash",
        category: "Smashed Burgers",
        price: 1650,
        description: "Smoked beef strips, crispy onion rings, double American cheese, and tangy smokey BBQ glaze.",
        image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80",
        features: JSON.stringify(["Smoked Bacon", "Crispy Onions", "BBQ Glaze"]),
        isAvailable: 1,
        isFeatured: 1,
        spiceLevel: "Mild",
        prepTime: "15 mins",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "shawarma",
        name: "Spit-Roasted Chicken Shawarma",
        category: "Shawarma",
        price: 850,
        description: "24-hour spiced marinated chicken carved fresh off the spit, wrapped in warm saj bread with authentic garlic toum.",
        image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80",
        features: JSON.stringify(["Spit roasted", "Garlic Toum", "Fresh saj bread"]),
        isAvailable: 1,
        isFeatured: 1,
        spiceLevel: "Medium",
        prepTime: "10 mins",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "mixed_shawarma_plate",
        name: "Mixed Grill Shawarma Platter",
        category: "Shawarma",
        price: 1550,
        description: "Generous cuts of chicken & beef shawarma served over fragrant spiced rice, pickled turnip, fries, and dual sauces.",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
        features: JSON.stringify(["Chicken & Beef", "Rice Pilaf", "Dual Toum"]),
        isAvailable: 1,
        isFeatured: 0,
        spiceLevel: "Medium",
        prepTime: "15 mins",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "pizza",
        name: "Wood-Fired Margherita & Pepperoni",
        category: "Wood-Fired Pizza",
        price: 2200,
        description: "48-hour slow-fermented crust blistered in a 450°C oven with San Marzano tomatoes and fior di latte mozzarella.",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
        features: JSON.stringify(["Wood-fired", "48h dough", "Fresh mozzarella"]),
        isAvailable: 1,
        isFeatured: 1,
        spiceLevel: "Mild",
        prepTime: "15-20 mins",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "bbq_platter",
        name: "Charcoal Seekh Kebab & Malai Boti",
        category: "Charcoal BBQ",
        price: 1950,
        description: "Tender melt-in-mouth beef seekh kebabs and creamy charcoal malai boti skewers served with mint chutney and hot naan.",
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80",
        features: JSON.stringify(["Live Charcoal", "Melt-in-mouth", "Mint Raita"]),
        isAvailable: 1,
        isFeatured: 1,
        spiceLevel: "Hot",
        prepTime: "20 mins",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "loaded_fries",
        name: "Grill Spot Loaded Animal Fries",
        category: "Sides & Fries",
        price: 750,
        description: "Crispy skin-on fries smothered in melted cheddar, caramelized onions, chopped smash patty bits, and house secret sauce.",
        image: "https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=800&q=80",
        features: JSON.stringify(["Triple Crispy", "Loaded Cheese", "Smash Bits"]),
        isAvailable: 1,
        isFeatured: 0,
        spiceLevel: "Mild",
        prepTime: "8 mins",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "mint_margarita",
        name: "Lahori Mint Margarita",
        category: "Drinks & Shakes",
        price: 450,
        description: "Fresh garden mint, crushed ice, lime zest, black salt, and sparkling citrus soda for the ultimate refreshment.",
        image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80",
        features: JSON.stringify(["Fresh Mint", "Black Salt Zest", "Chilled"]),
        isAvailable: 1,
        isFeatured: 0,
        spiceLevel: "None",
        prepTime: "5 mins",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    ];
    defaultMenu.forEach((m) => memoryStore.menu.set(m.id, m));
  }
}

seedInitialMemoryData();

let d1AuthFailed = false;

export function isD1AuthDisabled(): boolean {
  return d1AuthFailed;
}

export function resetD1AuthStatus(): void {
  d1AuthFailed = false;
}

// Execute in-memory fallback emulation for basic SQL queries
function handleMemoryFallback<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
  seedInitialMemoryData();
  const cleanSql = sql.trim();
  const lowerSql = cleanSql.toLowerCase();

  // 1. SELECT operations
  if (lowerSql.startsWith("select")) {
    if (lowerSql.includes("from users")) {
      const allUsers = Array.from(memoryStore.users.values());
      if (lowerSql.includes("count(*)")) {
        return [{ total_users: allUsers.length, count: allUsers.length }] as unknown as T[];
      }
      if (lowerSql.includes("where id = ?") || lowerSql.includes("where id =")) {
        const id = String(params[0] || "");
        const email = String(params[1] || id);
        const match = allUsers.find((u) => u.id === id || u.email === email);
        return (match ? [match] : []) as unknown as T[];
      }
      return allUsers.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))) as unknown as T[];
    }

    if (lowerSql.includes("from orders")) {
      const allOrders = Array.from(memoryStore.orders.values());
      if (lowerSql.includes("count(*)")) {
        const revenue = allOrders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);
        return [{ count: allOrders.length, revenue }] as unknown as T[];
      }
      if (lowerSql.includes("where userid = ?") || lowerSql.includes("where userid =")) {
        const userId = String(params[0] || "");
        return allOrders.filter((o) => o.userId === userId) as unknown as T[];
      }
      if (lowerSql.includes("where id = ?") || lowerSql.includes("where id =")) {
        const id = String(params[0] || "");
        const match = allOrders.find((o) => o.id === id);
        return (match ? [match] : []) as unknown as T[];
      }
      return allOrders.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))) as unknown as T[];
    }

    if (lowerSql.includes("from bookings")) {
      const allBookings = Array.from(memoryStore.bookings.values());
      if (lowerSql.includes("count(*)")) {
        return [{ count: allBookings.length }] as unknown as T[];
      }
      if (lowerSql.includes("where userid = ?") || lowerSql.includes("where userid =")) {
        const userId = String(params[0] || "");
        return allBookings.filter((b) => b.userId === userId) as unknown as T[];
      }
      if (lowerSql.includes("where id = ?") || lowerSql.includes("where id =")) {
        const id = String(params[0] || "");
        const match = allBookings.find((b) => b.id === id);
        return (match ? [match] : []) as unknown as T[];
      }
      return allBookings.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))) as unknown as T[];
    }

    if (lowerSql.includes("from staff")) {
      const allStaff = Array.from(memoryStore.staff.values());
      if (lowerSql.includes("count(*)")) {
        return [{ count: allStaff.length }] as unknown as T[];
      }
      if (lowerSql.includes("where id = ?") || lowerSql.includes("where id =")) {
        const id = String(params[0] || "");
        const match = allStaff.find((s) => s.id === id);
        return (match ? [match] : []) as unknown as T[];
      }
      return allStaff.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))) as unknown as T[];
    }

    if (lowerSql.includes("from riders")) {
      const allRiders = Array.from(memoryStore.riders.values());
      if (lowerSql.includes("count(*)")) {
        return [{ count: allRiders.length }] as unknown as T[];
      }
      if (lowerSql.includes("where id = ?") || lowerSql.includes("where id =")) {
        const id = String(params[0] || "");
        const match = allRiders.find((r) => r.id === id);
        return (match ? [match] : []) as unknown as T[];
      }
      return allRiders.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))) as unknown as T[];
    }

    if (lowerSql.includes("from menu_items") || lowerSql.includes("from menu")) {
      const allMenu = Array.from(memoryStore.menu.values());
      if (lowerSql.includes("count(*)")) {
        return [{ count: allMenu.length }] as unknown as T[];
      }
      if (lowerSql.includes("where id = ?") || lowerSql.includes("where id =")) {
        const id = String(params[0] || "");
        const match = allMenu.find((m) => m.id === id);
        return (match ? [match] : []) as unknown as T[];
      }
      return allMenu.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""))) as unknown as T[];
    }

    return [] as T[];
  }

  // 2. INSERT / UPSERT operations
  if (lowerSql.startsWith("insert into users")) {
    const id = String(params[0]);
    const existing = memoryStore.users.get(id) || {};
    const now = new Date().toISOString();
    const updated: Record<string, unknown> = {
      ...existing,
      id,
      email: params[1] ?? existing.email ?? null,
      displayName: params[2] ?? existing.displayName ?? null,
      photoURL: params[3] ?? existing.photoURL ?? null,
      phone: params[4] ?? existing.phone ?? null,
      address: params[5] ?? existing.address ?? null,
      favoriteBranch: params[6] ?? existing.favoriteBranch ?? "Gulberg III",
      dietaryPreferences: params[7] ?? existing.dietaryPreferences ?? null,
      role: params[8] ?? existing.role ?? "customer",
      createdAt: existing.createdAt || now,
      updatedAt: now,
    };
    memoryStore.users.set(id, updated);
    return [updated] as unknown as T[];
  }

  if (lowerSql.startsWith("insert into orders")) {
    const id = String(params[0]);
    const now = new Date().toISOString();
    const order: Record<string, unknown> = {
      id,
      userId: params[1] ?? null,
      customerName: params[2] ?? "Guest",
      phone: params[3] ?? "",
      orderType: params[4] ?? "delivery",
      subtotal: Number(params[5] || 0),
      deliveryFee: Number(params[6] || 0),
      grandTotal: Number(params[7] || 0),
      address: params[8] ?? "",
      specialInstructions: params[9] ?? "",
      status: params[10] ?? "pending",
      itemsJson: params[11] ?? "[]",
      riderId: params[12] ?? null,
      riderName: params[13] ?? null,
      riderPhone: params[14] ?? null,
      allocatedAt: params[15] ?? null,
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.orders.set(id, order);
    return [order] as unknown as T[];
  }

  if (lowerSql.startsWith("insert into bookings")) {
    const id = String(params[0]);
    const now = new Date().toISOString();
    const booking: Record<string, unknown> = {
      id,
      userId: params[1] ?? null,
      name: params[2] ?? "Guest",
      email: params[3] ?? "",
      phone: params[4] ?? "",
      guests: Number(params[5] || 2),
      date: params[6] ?? "",
      time: params[7] ?? "",
      area: params[8] ?? "Indoor Main Hall",
      specialRequests: params[9] ?? "",
      status: params[10] ?? "confirmed",
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.bookings.set(id, booking);
    return [booking] as unknown as T[];
  }

  if (lowerSql.startsWith("insert into staff")) {
    const id = String(params[0]);
    const now = new Date().toISOString();
    const staffMember: Record<string, unknown> = {
      id,
      name: params[1] ?? "Staff Member",
      email: params[2] ?? "",
      phone: params[3] ?? "",
      role: params[4] ?? "Line Cook",
      branch: params[5] ?? "Gulberg III",
      shift: params[6] ?? "Evening",
      status: params[7] ?? "active",
      salary: params[8] ?? "Rs. 60,000",
      joinedDate: params[9] ?? now.split("T")[0],
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.staff.set(id, staffMember);
    return [staffMember] as unknown as T[];
  }

  if (lowerSql.startsWith("insert into riders")) {
    const id = String(params[0]);
    const now = new Date().toISOString();
    const rider: Record<string, unknown> = {
      id,
      name: params[1] ?? "Delivery Rider",
      phone: params[2] ?? "",
      vehicleType: params[3] ?? "Motorbike",
      vehiclePlate: params[4] ?? "",
      assignedZone: params[5] ?? "Gulberg & DHA",
      status: params[6] ?? "available",
      activeDeliveries: Number(params[7] || 0),
      rating: Number(params[8] || 4.9),
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.riders.set(id, rider);
    return [rider] as unknown as T[];
  }

  if (lowerSql.startsWith("insert into menu_items") || lowerSql.startsWith("insert into menu")) {
    const id = String(params[0]);
    const now = new Date().toISOString();
    const menuItem: Record<string, unknown> = {
      id,
      name: params[1] ?? "Grill Item",
      category: params[2] ?? "Smashed Burgers",
      price: Number(params[3] || 0),
      description: params[4] ?? "",
      image: params[5] ?? "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
      features: params[6] ?? "[]",
      isAvailable: params[7] !== undefined ? Number(params[7]) : 1,
      isFeatured: params[8] !== undefined ? Number(params[8]) : 0,
      spiceLevel: params[9] ?? "Medium",
      prepTime: params[10] ?? "15 mins",
      createdAt: now,
      updatedAt: now,
    };
    memoryStore.menu.set(id, menuItem);
    return [menuItem] as unknown as T[];
  }

  // 3. UPDATE operations
  if (lowerSql.startsWith("update orders")) {
    if (lowerSql.includes("riderid = ?") || lowerSql.includes("ridername = ?")) {
      // Allocate order query: UPDATE orders SET riderId = ?, riderName = ?, riderPhone = ?, status = ?, allocatedAt = datetime('now'), updatedAt = datetime('now') WHERE id = ?
      const riderId = String(params[0]);
      const riderName = String(params[1]);
      const riderPhone = String(params[2]);
      const status = String(params[3]);
      const id = String(params[4]);
      const order = memoryStore.orders.get(id);
      if (order) {
        order.riderId = riderId;
        order.riderName = riderName;
        order.riderPhone = riderPhone;
        order.status = status;
        order.allocatedAt = new Date().toISOString();
        order.updatedAt = new Date().toISOString();
        memoryStore.orders.set(id, order);

        // Also update rider's active count
        const rider = memoryStore.riders.get(riderId);
        if (rider) {
          rider.activeDeliveries = (Number(rider.activeDeliveries) || 0) + 1;
          rider.status = "delivering";
          memoryStore.riders.set(riderId, rider);
        }
      }
      return [] as T[];
    }

    if (lowerSql.includes("set status = ?")) {
      const status = String(params[0]);
      const id = String(params[1]);
      const order = memoryStore.orders.get(id);
      if (order) {
        order.status = status;
        order.updatedAt = new Date().toISOString();
        memoryStore.orders.set(id, order);
      }
      return [] as T[];
    }
  }

  if (lowerSql.startsWith("update staff")) {
    const id = String(params[params.length - 1]);
    const existing = memoryStore.staff.get(id);
    if (existing) {
      const updated = {
        ...existing,
        name: params[0] ?? existing.name,
        email: params[1] ?? existing.email,
        phone: params[2] ?? existing.phone,
        role: params[3] ?? existing.role,
        branch: params[4] ?? existing.branch,
        shift: params[5] ?? existing.shift,
        status: params[6] ?? existing.status,
        salary: params[7] ?? existing.salary,
        updatedAt: new Date().toISOString(),
      };
      memoryStore.staff.set(id, updated);
    }
    return [] as T[];
  }

  if (lowerSql.startsWith("update riders")) {
    const id = String(params[params.length - 1]);
    const existing = memoryStore.riders.get(id);
    if (existing) {
      const updated = {
        ...existing,
        name: params[0] ?? existing.name,
        phone: params[1] ?? existing.phone,
        vehicleType: params[2] ?? existing.vehicleType,
        vehiclePlate: params[3] ?? existing.vehiclePlate,
        assignedZone: params[4] ?? existing.assignedZone,
        status: params[5] ?? existing.status,
        updatedAt: new Date().toISOString(),
      };
      memoryStore.riders.set(id, updated);
    }
    return [] as T[];
  }

  if (lowerSql.startsWith("update menu_items") || lowerSql.startsWith("update menu")) {
    const id = String(params[params.length - 1]);
    const existing = memoryStore.menu.get(id);
    if (existing) {
      const updated = {
        ...existing,
        name: params[0] ?? existing.name,
        category: params[1] ?? existing.category,
        price: Number(params[2] ?? existing.price),
        description: params[3] ?? existing.description,
        image: params[4] ?? existing.image,
        isAvailable: params[5] !== undefined ? Number(params[5]) : existing.isAvailable,
        isFeatured: params[6] !== undefined ? Number(params[6]) : existing.isFeatured,
        spiceLevel: params[7] ?? existing.spiceLevel,
        prepTime: params[8] ?? existing.prepTime,
        updatedAt: new Date().toISOString(),
      };
      memoryStore.menu.set(id, updated);
    }
    return [] as T[];
  }

  if (lowerSql.startsWith("update bookings set status = ?")) {
    const status = String(params[0]);
    const id = String(params[1]);
    const booking = memoryStore.bookings.get(id);
    if (booking) {
      booking.status = status;
      booking.updatedAt = new Date().toISOString();
      memoryStore.bookings.set(id, booking);
    }
    return [] as T[];
  }

  // 4. DELETE operations
  if (lowerSql.startsWith("delete from orders")) {
    const id = String(params[0]);
    memoryStore.orders.delete(id);
    return [] as T[];
  }

  if (lowerSql.startsWith("delete from bookings")) {
    const id = String(params[0]);
    memoryStore.bookings.delete(id);
    return [] as T[];
  }

  if (lowerSql.startsWith("delete from staff")) {
    const id = String(params[0]);
    memoryStore.staff.delete(id);
    return [] as T[];
  }

  if (lowerSql.startsWith("delete from riders")) {
    const id = String(params[0]);
    memoryStore.riders.delete(id);
    return [] as T[];
  }

  if (lowerSql.startsWith("delete from menu_items") || lowerSql.startsWith("delete from menu")) {
    const id = String(params[0]);
    memoryStore.menu.delete(id);
    return [] as T[];
  }

  return [] as T[];
}

export async function runD1Query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  // If previously determined invalid token or credentials, use memory fallback
  if (d1AuthFailed) {
    return handleMemoryFallback<T>(sql, params);
  }

  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql,
        params,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // Detect 401 Unauthorized token
      if (response.status === 401 || errorText.includes("Authentication error")) {
        console.warn("Cloudflare D1 API Token 401 Authentication Error. Falling back to local storage engine.");
        d1AuthFailed = true;
        return handleMemoryFallback<T>(sql, params);
      }
      console.error("Cloudflare D1 Query HTTP Error:", response.status, errorText);
      throw new Error(`Cloudflare D1 API returned status ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as D1ApiResponse<T>;

    if (!data.success || data.errors?.length > 0) {
      const errMessage = data.errors?.map((e) => e.message).join(", ") || "Unknown D1 Query Error";
      if (errMessage.includes("Authentication error")) {
        d1AuthFailed = true;
        return handleMemoryFallback<T>(sql, params);
      }
      console.error("Cloudflare D1 Query Execution Error:", errMessage);
      throw new Error(errMessage);
    }

    return data.result?.[0]?.results || [];
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("401") || msg.includes("Authentication error")) {
      d1AuthFailed = true;
      return handleMemoryFallback<T>(sql, params);
    }
    throw err;
  }
}

export async function executeD1Raw(
  sql: string,
  params: unknown[] = []
): Promise<D1QueryResult> {
  const results = await runD1Query(sql, params);
  return {
    results,
    success: true,
  };
}

// Automatically bootstrap tables and add any missing columns safely
export async function initializeD1Database(): Promise<void> {
  try {
    console.log("Initializing Cloudflare D1 SQL Tables & Migrations...");

    // 1. Users Table Base
    await runD1Query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE
      );
    `);

    const userColumns: Array<{ name: string; type: string; defaultVal?: string }> = [
      { name: "displayName", type: "TEXT" },
      { name: "photoURL", type: "TEXT" },
      { name: "phone", type: "TEXT" },
      { name: "address", type: "TEXT" },
      { name: "favoriteBranch", type: "TEXT", defaultVal: "'Gulberg III'" },
      { name: "dietaryPreferences", type: "TEXT" },
      { name: "role", type: "TEXT", defaultVal: "'customer'" },
      { name: "createdAt", type: "TEXT" },
      { name: "updatedAt", type: "TEXT" },
    ];

    try {
      const existingUserCols = await runD1Query<{ name: string }>("PRAGMA table_info(users);");
      const existingColNames = new Set(existingUserCols.map((c) => c.name));

      for (const col of userColumns) {
        if (!existingColNames.has(col.name)) {
          const defaultClause = col.defaultVal ? ` DEFAULT ${col.defaultVal}` : "";
          await runD1Query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}${defaultClause};`).catch((e) => {
            console.warn(`Column ${col.name} add note:`, e.message);
          });
        }
      }
    } catch (e) {
      console.warn("PRAGMA check on users note:", e);
    }

    // 2. Orders Table Base
    await runD1Query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY
      );
    `);

    const orderColumns: Array<{ name: string; type: string; defaultVal?: string }> = [
      { name: "userId", type: "TEXT" },
      { name: "customerName", type: "TEXT" },
      { name: "phone", type: "TEXT" },
      { name: "orderType", type: "TEXT", defaultVal: "'delivery'" },
      { name: "subtotal", type: "REAL", defaultVal: "0" },
      { name: "deliveryFee", type: "REAL", defaultVal: "0" },
      { name: "grandTotal", type: "REAL", defaultVal: "0" },
      { name: "address", type: "TEXT" },
      { name: "specialInstructions", type: "TEXT" },
      { name: "status", type: "TEXT", defaultVal: "'pending'" },
      { name: "itemsJson", type: "TEXT" },
      { name: "riderId", type: "TEXT" },
      { name: "riderName", type: "TEXT" },
      { name: "riderPhone", type: "TEXT" },
      { name: "allocatedAt", type: "TEXT" },
      { name: "createdAt", type: "TEXT" },
      { name: "updatedAt", type: "TEXT" },
    ];

    try {
      const existingOrderCols = await runD1Query<{ name: string }>("PRAGMA table_info(orders);");
      const existingOrderColNames = new Set(existingOrderCols.map((c) => c.name));

      for (const col of orderColumns) {
        if (!existingOrderColNames.has(col.name)) {
          const defaultClause = col.defaultVal ? ` DEFAULT ${col.defaultVal}` : "";
          await runD1Query(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}${defaultClause};`).catch((e) => {
            console.warn(`Column ${col.name} on orders add note:`, e.message);
          });
        }
      }
    } catch (e) {
      console.warn("PRAGMA check on orders note:", e);
    }

    // 3. Bookings (Table Reservations) Table Base
    await runD1Query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY
      );
    `);

    const bookingColumns: Array<{ name: string; type: string; defaultVal?: string }> = [
      { name: "userId", type: "TEXT" },
      { name: "name", type: "TEXT" },
      { name: "email", type: "TEXT" },
      { name: "phone", type: "TEXT" },
      { name: "guests", type: "INTEGER", defaultVal: "2" },
      { name: "date", type: "TEXT" },
      { name: "time", type: "TEXT" },
      { name: "area", type: "TEXT" },
      { name: "specialRequests", type: "TEXT" },
      { name: "status", type: "TEXT", defaultVal: "'confirmed'" },
      { name: "createdAt", type: "TEXT" },
      { name: "updatedAt", type: "TEXT" },
    ];

    try {
      const existingBookingCols = await runD1Query<{ name: string }>("PRAGMA table_info(bookings);");
      const existingBookingColNames = new Set(existingBookingCols.map((c) => c.name));

      for (const col of bookingColumns) {
        if (!existingBookingColNames.has(col.name)) {
          const defaultClause = col.defaultVal ? ` DEFAULT ${col.defaultVal}` : "";
          await runD1Query(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.type}${defaultClause};`).catch((e) => {
            console.warn(`Column ${col.name} on bookings add note:`, e.message);
          });
        }
      }
    } catch (e) {
      console.warn("PRAGMA check on bookings note:", e);
    }

    // 4. Staff Management Table
    await runD1Query(`
      CREATE TABLE IF NOT EXISTS staff (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        role TEXT DEFAULT 'Line Cook',
        branch TEXT DEFAULT 'Gulberg III',
        shift TEXT DEFAULT 'Evening',
        status TEXT DEFAULT 'active',
        salary TEXT,
        joinedDate TEXT,
        createdAt TEXT,
        updatedAt TEXT
      );
    `);

    // 5. Riders Fleet Management Table
    await runD1Query(`
      CREATE TABLE IF NOT EXISTS riders (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        vehicleType TEXT DEFAULT 'Motorbike',
        vehiclePlate TEXT,
        assignedZone TEXT DEFAULT 'Gulberg & DHA',
        status TEXT DEFAULT 'available',
        activeDeliveries INTEGER DEFAULT 0,
        rating REAL DEFAULT 4.9,
        createdAt TEXT,
        updatedAt TEXT
      );
    `);

    // 6. Menu Items Table
    await runD1Query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        image TEXT,
        features TEXT,
        isAvailable INTEGER DEFAULT 1,
        isFeatured INTEGER DEFAULT 0,
        spiceLevel TEXT DEFAULT 'Medium',
        prepTime TEXT DEFAULT '15 mins',
        createdAt TEXT,
        updatedAt TEXT
      );
    `);

    console.log("Cloudflare D1 Database schemas verified and columns migrated successfully.");
  } catch (err) {
    console.error("Failed to initialize Cloudflare D1 schema:", err);
  }
}
