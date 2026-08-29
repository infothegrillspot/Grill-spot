// Cloudflare D1 Database Helper & API Client

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

export async function runD1Query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`;

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
    console.error("Cloudflare D1 Query HTTP Error:", response.status, errorText);
    throw new Error(`Cloudflare D1 API returned status ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as D1ApiResponse<T>;

  if (!data.success || data.errors?.length > 0) {
    const errMessage = data.errors?.map((e) => e.message).join(", ") || "Unknown D1 Query Error";
    console.error("Cloudflare D1 Query Execution Error:", errMessage);
    throw new Error(errMessage);
  }

  return data.result?.[0]?.results || [];
}

export async function executeD1Raw(
  sql: string,
  params: unknown[] = []
): Promise<D1QueryResult> {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`;

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
    console.error("Cloudflare D1 Raw HTTP Error:", response.status, errorText);
    throw new Error(`Cloudflare D1 API returned status ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as D1ApiResponse;
  if (!data.success || data.errors?.length > 0) {
    const errMessage = data.errors?.map((e) => e.message).join(", ") || "Unknown D1 Query Error";
    throw new Error(errMessage);
  }

  return data.result?.[0] || { results: [], success: true };
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

    // Ensure all user columns exist (SQLite ALTER TABLE only permits literal constant defaults, NOT function calls)
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
      // Populate timestamp defaults for existing rows if null
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
