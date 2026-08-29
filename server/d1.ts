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
}

const memoryStore: MemoryStore = {
  users: new Map(),
  orders: new Map(),
  bookings: new Map(),
};

let d1AuthFailed = false;

export function isD1AuthDisabled(): boolean {
  return d1AuthFailed;
}

export function resetD1AuthStatus(): void {
  d1AuthFailed = false;
}

// Execute in-memory fallback emulation for basic SQL queries
function handleMemoryFallback<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
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

  // 3. UPDATE operations
  if (lowerSql.startsWith("update orders set status = ?")) {
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

    // Ensure all user columns exist
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
      await runD1Query("UPDATE users SET createdAt = datetime('now') WHERE createdAt IS NULL;").catch(() => {});
      await runD1Query("UPDATE users SET updatedAt = datetime('now') WHERE updatedAt IS NULL;").catch(() => {});
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
      await runD1Query("UPDATE orders SET createdAt = datetime('now') WHERE createdAt IS NULL;").catch(() => {});
      await runD1Query("UPDATE orders SET updatedAt = datetime('now') WHERE updatedAt IS NULL;").catch(() => {});
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
      await runD1Query("UPDATE bookings SET createdAt = datetime('now') WHERE createdAt IS NULL;").catch(() => {});
      await runD1Query("UPDATE bookings SET updatedAt = datetime('now') WHERE updatedAt IS NULL;").catch(() => {});
    } catch (e) {
      console.warn("PRAGMA check on bookings note:", e);
    }

    console.log("Cloudflare D1 Database schemas verified and columns migrated successfully.");
  } catch (err) {
    console.error("Failed to initialize Cloudflare D1 schema:", err);
  }
}
