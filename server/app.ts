import express, { Request, Response, Router } from "express";
import cors from "cors";
import { runD1Query, initializeD1Database } from "./d1";

export const app = express();

app.use(cors());
app.use(express.json());

// Initialize D1 SQLite tables safely on startup
initializeD1Database().catch((err) => {
  console.warn("Initial D1 DB sync notice:", err.message);
});

// Router for Cloudflare D1 operations
const d1Router = Router();

// 1. Health & Connection Check
d1Router.get("/health", async (req: Request, res: Response) => {
  try {
    const result = await runD1Query<{ total_users: number }>("SELECT count(*) as total_users FROM users").catch(() => [{ total_users: 0 }]);
    res.json({
      status: "online",
      database: "Cloudflare D1 SQLite",
      databaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || "c41385c3-6bbd-4b69-88c3-d3d155c17cf7",
      usersCount: result[0]?.total_users ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "D1 connection failed";
    res.status(500).json({ status: "error", message });
  }
});

// 2. Initialize Database Schema
d1Router.post("/init", async (req: Request, res: Response) => {
  try {
    await initializeD1Database();
    res.json({ success: true, message: "Cloudflare D1 tables initialized successfully." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Schema init failed";
    res.status(500).json({ success: false, error: message });
  }
});

// 3. User Profile Endpoints
d1Router.get("/users", async (req: Request, res: Response) => {
  try {
    const fetchUsers = () =>
      runD1Query("SELECT * FROM users ORDER BY createdAt DESC").catch(async (err) => {
        if (String(err.message).includes("no such column") || String(err.message).includes("no such table")) {
          await initializeD1Database();
          return runD1Query("SELECT * FROM users ORDER BY rowid DESC").catch(() => []);
        }
        throw err;
      });

    const users = await fetchUsers();
    res.json({ success: true, users });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch users";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const users = await runD1Query(
      "SELECT * FROM users WHERE id = ? OR email = ? LIMIT 1",
      [id, id]
    ).catch(async (err) => {
      if (String(err.message).includes("no such table")) {
        await initializeD1Database();
        return [];
      }
      throw err;
    });
    if (users.length === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, user: users[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch user";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.post("/users/upsert", async (req: Request, res: Response) => {
  try {
    const {
      id,
      email,
      displayName,
      photoURL,
      phone,
      address,
      favoriteBranch,
      dietaryPreferences,
      role,
    } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, error: "User ID is required" });
    }

    const performUpsert = async () => {
      const existing = await runD1Query(
        "SELECT id, role FROM users WHERE id = ? OR email = ? LIMIT 1",
        [id, email || ""]
      ).catch(() => []);

      const userRole = role || (existing[0] as { role?: string })?.role || "customer";

      await runD1Query(
        `INSERT INTO users (id, email, displayName, photoURL, phone, address, favoriteBranch, dietaryPreferences, role, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET
           email = coalesce(excluded.email, users.email),
           displayName = coalesce(excluded.displayName, users.displayName),
           photoURL = coalesce(excluded.photoURL, users.photoURL),
           phone = coalesce(excluded.phone, users.phone),
           address = coalesce(excluded.address, users.address),
           favoriteBranch = coalesce(excluded.favoriteBranch, users.favoriteBranch),
           dietaryPreferences = coalesce(excluded.dietaryPreferences, users.dietaryPreferences),
           role = excluded.role,
           updatedAt = datetime('now')`,
        [
          id,
          email || null,
          displayName || null,
          photoURL || null,
          phone || null,
          address || null,
          favoriteBranch || "Gulberg III",
          dietaryPreferences || null,
          userRole,
        ]
      );

      const updatedUser = await runD1Query("SELECT * FROM users WHERE id = ? LIMIT 1", [id]);
      return updatedUser[0];
    };

    try {
      const result = await performUpsert();
      return res.json({ success: true, user: result });
    } catch (upsertErr: unknown) {
      const errMsg = upsertErr instanceof Error ? upsertErr.message : String(upsertErr);
      if (errMsg.includes("no column named") || errMsg.includes("no such table") || errMsg.includes("no such column")) {
        await initializeD1Database();
        const result = await performUpsert();
        return res.json({ success: true, user: result });
      }
      throw upsertErr;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to upsert user";
    console.error("Upsert user error:", message);
    res.status(500).json({ success: false, error: message });
  }
});

// 4. Orders Endpoints
d1Router.get("/orders", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const fetchOrders = () => {
      if (userId) {
        return runD1Query(
          "SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC",
          [String(userId)]
        );
      }
      return runD1Query("SELECT * FROM orders ORDER BY createdAt DESC");
    };

    let orders;
    try {
      orders = await fetchOrders();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("no such column") || errMsg.includes("no such table")) {
        await initializeD1Database();
        orders = await (userId
          ? runD1Query("SELECT * FROM orders WHERE userId = ?", [String(userId)]).catch(() => [])
          : runD1Query("SELECT * FROM orders").catch(() => []));
      } else {
        throw err;
      }
    }

    // Parse itemsJson safely
    const formattedOrders = orders.map((o: Record<string, unknown>) => {
      let parsedItems: unknown[] = [];
      if (typeof o.itemsJson === "string") {
        try {
          parsedItems = JSON.parse(o.itemsJson);
        } catch {
          parsedItems = [];
        }
      } else if (Array.isArray(o.items)) {
        parsedItems = o.items;
      } else if (Array.isArray(o.itemsJson)) {
        parsedItems = o.itemsJson;
      }

      return {
        ...o,
        items: Array.isArray(parsedItems) ? parsedItems : [],
      };
    });

    res.json({ success: true, orders: formattedOrders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.post("/orders", async (req: Request, res: Response) => {
  try {
    const {
      id = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      customerName,
      phone,
      orderType = "delivery",
      subtotal = 0,
      deliveryFee = 0,
      grandTotal = 0,
      address = "",
      specialInstructions = "",
      status = "pending",
      items = [],
      riderId = null,
      riderName = null,
      riderPhone = null,
    } = req.body;

    const itemsJson = typeof items === "string" ? items : JSON.stringify(items);

    const performInsert = async () => {
      await runD1Query(
        `INSERT INTO orders (
          id, userId, customerName, phone, orderType, subtotal, deliveryFee, grandTotal, address, specialInstructions, status, itemsJson, riderId, riderName, riderPhone, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          id,
          userId || null,
          customerName || "Guest",
          phone || "",
          orderType,
          Number(subtotal),
          Number(deliveryFee),
          Number(grandTotal),
          address || "",
          specialInstructions || "",
          status,
          itemsJson,
          riderId || null,
          riderName || null,
          riderPhone || null,
        ]
      );

      const inserted = await runD1Query("SELECT * FROM orders WHERE id = ? LIMIT 1", [id]);
      return {
        ...inserted[0],
        items: items,
      };
    };

    try {
      const order = await performInsert();
      res.json({ success: true, order });
    } catch (insertErr: unknown) {
      const errMsg = insertErr instanceof Error ? insertErr.message : String(insertErr);
      if (errMsg.includes("no column named") || errMsg.includes("no such table") || errMsg.includes("no such column")) {
        await initializeD1Database();
        const order = await performInsert();
        return res.json({ success: true, order });
      }
      throw insertErr;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create order";
    console.error("Create order error:", message);
    res.status(500).json({ success: false, error: message });
  }
});

// Allocate Order to Rider
d1Router.patch("/orders/:id/allocate", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { riderId, riderName, riderPhone, status = "out_for_delivery" } = req.body;

    if (!riderId || !riderName) {
      return res.status(400).json({ success: false, error: "Rider ID and Name are required for allocation" });
    }

    await runD1Query(
      `UPDATE orders SET 
        riderId = ?, 
        riderName = ?, 
        riderPhone = ?, 
        status = ?, 
        allocatedAt = datetime('now'), 
        updatedAt = datetime('now') 
      WHERE id = ?`,
      [riderId, riderName, riderPhone || "", status, id]
    );

    // Also update rider's active count if possible
    await runD1Query(
      "UPDATE riders SET activeDeliveries = activeDeliveries + 1, status = 'delivering', updatedAt = datetime('now') WHERE id = ?",
      [riderId]
    ).catch(() => {});

    res.json({ success: true, message: `Order ${id} successfully allocated to rider ${riderName}` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to allocate order to rider";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.patch("/orders/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: "Status is required" });
    }

    await runD1Query(
      "UPDATE orders SET status = ?, updatedAt = datetime('now') WHERE id = ?",
      [status, id]
    );

    res.json({ success: true, message: `Order ${id} updated to ${status}` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update order status";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.delete("/orders/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await runD1Query("DELETE FROM orders WHERE id = ?", [id]);
    res.json({ success: true, message: `Order ${id} deleted` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete order";
    res.status(500).json({ success: false, error: message });
  }
});

// 5. Bookings / Reservations Endpoints
d1Router.get("/bookings", async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    const fetchBookings = () => {
      if (userId) {
        return runD1Query(
          "SELECT * FROM bookings WHERE userId = ? ORDER BY createdAt DESC",
          [String(userId)]
        );
      }
      return runD1Query("SELECT * FROM bookings ORDER BY createdAt DESC");
    };

    let bookings;
    try {
      bookings = await fetchBookings();
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes("no such column") || errMsg.includes("no such table")) {
        await initializeD1Database();
        bookings = await (userId
          ? runD1Query("SELECT * FROM bookings WHERE userId = ?", [String(userId)]).catch(() => [])
          : runD1Query("SELECT * FROM bookings").catch(() => []));
      } else {
        throw err;
      }
    }

    res.json({ success: true, bookings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch bookings";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.post("/bookings", async (req: Request, res: Response) => {
  try {
    const {
      id = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      name,
      email,
      phone,
      guests = 2,
      date,
      time,
      area = "Indoor Main Hall",
      specialRequests = "",
      status = "confirmed",
    } = req.body;

    const performInsert = async () => {
      await runD1Query(
        `INSERT INTO bookings (
          id, userId, name, email, phone, guests, date, time, area, specialRequests, status, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [
          id,
          userId || null,
          name || "Guest",
          email || "",
          phone || "",
          Number(guests),
          date || "",
          time || "",
          area,
          specialRequests || "",
          status,
        ]
      );

      const inserted = await runD1Query("SELECT * FROM bookings WHERE id = ? LIMIT 1", [id]);
      return inserted[0];
    };

    try {
      const booking = await performInsert();
      res.json({ success: true, booking });
    } catch (insertErr: unknown) {
      const errMsg = insertErr instanceof Error ? insertErr.message : String(insertErr);
      if (errMsg.includes("no column named") || errMsg.includes("no such table") || errMsg.includes("no such column")) {
        await initializeD1Database();
        const booking = await performInsert();
        return res.json({ success: true, booking });
      }
      throw insertErr;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create booking";
    console.error("Create booking error:", message);
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.patch("/bookings/:id/status", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: "Status is required" });
    }

    await runD1Query(
      "UPDATE bookings SET status = ?, updatedAt = datetime('now') WHERE id = ?",
      [status, id]
    );

    res.json({ success: true, message: `Booking ${id} status updated to ${status}` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update booking status";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.delete("/bookings/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await runD1Query("DELETE FROM bookings WHERE id = ?", [id]);
    res.json({ success: true, message: `Booking ${id} deleted` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete booking";
    res.status(500).json({ success: false, error: message });
  }
});

// 6. Staff Management Endpoints
d1Router.get("/staff", async (req: Request, res: Response) => {
  try {
    const staff = await runD1Query("SELECT * FROM staff ORDER BY createdAt DESC").catch(async () => {
      await initializeD1Database();
      return runD1Query("SELECT * FROM staff ORDER BY rowid DESC").catch(() => []);
    });
    res.json({ success: true, staff });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch staff";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.post("/staff", async (req: Request, res: Response) => {
  try {
    const {
      id = `stf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      email = "",
      phone = "",
      role = "Line Cook",
      branch = "Gulberg III",
      shift = "Evening",
      status = "active",
      salary = "Rs. 65,000",
      joinedDate = new Date().toISOString().split("T")[0],
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: "Staff name is required" });
    }

    await runD1Query(
      `INSERT INTO staff (id, name, email, phone, role, branch, shift, status, salary, joinedDate, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, name, email, phone, role, branch, shift, status, salary, joinedDate]
    );

    const inserted = await runD1Query("SELECT * FROM staff WHERE id = ? LIMIT 1", [id]);
    res.json({ success: true, staff: inserted[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create staff member";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.put("/staff/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, role, branch, shift, status, salary } = req.body;

    await runD1Query(
      `UPDATE staff SET 
        name = coalesce(?, name),
        email = coalesce(?, email),
        phone = coalesce(?, phone),
        role = coalesce(?, role),
        branch = coalesce(?, branch),
        shift = coalesce(?, shift),
        status = coalesce(?, status),
        salary = coalesce(?, salary),
        updatedAt = datetime('now')
      WHERE id = ?`,
      [name, email, phone, role, branch, shift, status, salary, id]
    );

    const updated = await runD1Query("SELECT * FROM staff WHERE id = ? LIMIT 1", [id]);
    res.json({ success: true, staff: updated[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update staff";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.delete("/staff/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await runD1Query("DELETE FROM staff WHERE id = ?", [id]);
    res.json({ success: true, message: `Staff ${id} deleted` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete staff";
    res.status(500).json({ success: false, error: message });
  }
});

// 7. Riders Fleet Endpoints
d1Router.get("/riders", async (req: Request, res: Response) => {
  try {
    const riders = await runD1Query("SELECT * FROM riders ORDER BY createdAt DESC").catch(async () => {
      await initializeD1Database();
      return runD1Query("SELECT * FROM riders ORDER BY rowid DESC").catch(() => []);
    });
    res.json({ success: true, riders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch riders";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.post("/riders", async (req: Request, res: Response) => {
  try {
    const {
      id = `rdr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      phone,
      vehicleType = "Motorbike (Honda 125)",
      vehiclePlate = "",
      assignedZone = "Gulberg & DHA",
      status = "available",
      activeDeliveries = 0,
      rating = 4.9,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ success: false, error: "Rider name and phone are required" });
    }

    await runD1Query(
      `INSERT INTO riders (id, name, phone, vehicleType, vehiclePlate, assignedZone, status, activeDeliveries, rating, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, name, phone, vehicleType, vehiclePlate, assignedZone, status, Number(activeDeliveries), Number(rating)]
    );

    const inserted = await runD1Query("SELECT * FROM riders WHERE id = ? LIMIT 1", [id]);
    res.json({ success: true, rider: inserted[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create rider";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.put("/riders/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, vehicleType, vehiclePlate, assignedZone, status } = req.body;

    await runD1Query(
      `UPDATE riders SET 
        name = coalesce(?, name),
        phone = coalesce(?, phone),
        vehicleType = coalesce(?, vehicleType),
        vehiclePlate = coalesce(?, vehiclePlate),
        assignedZone = coalesce(?, assignedZone),
        status = coalesce(?, status),
        updatedAt = datetime('now')
      WHERE id = ?`,
      [name, phone, vehicleType, vehiclePlate, assignedZone, status, id]
    );

    const updated = await runD1Query("SELECT * FROM riders WHERE id = ? LIMIT 1", [id]);
    res.json({ success: true, rider: updated[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update rider";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.delete("/riders/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await runD1Query("DELETE FROM riders WHERE id = ?", [id]);
    res.json({ success: true, message: `Rider ${id} deleted` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete rider";
    res.status(500).json({ success: false, error: message });
  }
});

// 8. Menu Items Endpoints
d1Router.get("/menu", async (req: Request, res: Response) => {
  try {
    const menuItems = await runD1Query("SELECT * FROM menu_items ORDER BY category, name").catch(async () => {
      await initializeD1Database();
      return runD1Query("SELECT * FROM menu_items ORDER BY rowid DESC").catch(() => []);
    });
    res.json({ success: true, menu: menuItems });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch menu";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.post("/menu", async (req: Request, res: Response) => {
  try {
    const {
      id = `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      category = "Smashed Burgers",
      price = 0,
      description = "",
      image = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
      features = "[]",
      options = "[]",
      isAvailable = 1,
      isFeatured = 0,
      spiceLevel = "Medium",
      prepTime = "15 mins",
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, error: "Item name and price are required" });
    }

    const featuresJson = typeof features === "string" ? features : JSON.stringify(features);
    const optionsJson = typeof options === "string" ? options : JSON.stringify(options);

    await runD1Query(
      `INSERT INTO menu_items (id, name, category, price, description, image, features, options, isAvailable, isFeatured, spiceLevel, prepTime, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [id, name, category, Number(price), description, image, featuresJson, optionsJson, Number(isAvailable), Number(isFeatured), spiceLevel, prepTime]
    );

    const inserted = await runD1Query("SELECT * FROM menu_items WHERE id = ? LIMIT 1", [id]);
    res.json({ success: true, item: inserted[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create menu item";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.put("/menu/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      price,
      description,
      image,
      features,
      options,
      isAvailable,
      isFeatured,
      spiceLevel,
      prepTime,
    } = req.body;

    const featuresParam = features !== undefined ? (typeof features === "string" ? features : JSON.stringify(features)) : null;
    const optionsParam = options !== undefined ? (typeof options === "string" ? options : JSON.stringify(options)) : null;

    await runD1Query(
      `UPDATE menu_items SET 
        name = coalesce(?, name),
        category = coalesce(?, category),
        price = coalesce(?, price),
        description = coalesce(?, description),
        image = coalesce(?, image),
        features = coalesce(?, features),
        options = coalesce(?, options),
        isAvailable = coalesce(?, isAvailable),
        isFeatured = coalesce(?, isFeatured),
        spiceLevel = coalesce(?, spiceLevel),
        prepTime = coalesce(?, prepTime),
        updatedAt = datetime('now')
      WHERE id = ?`,
      [
        name,
        category,
        price !== undefined ? Number(price) : null,
        description,
        image,
        featuresParam,
        optionsParam,
        isAvailable !== undefined ? Number(isAvailable) : null,
        isFeatured !== undefined ? Number(isFeatured) : null,
        spiceLevel,
        prepTime,
        id,
      ]
    );

    const updated = await runD1Query("SELECT * FROM menu_items WHERE id = ? LIMIT 1", [id]);
    res.json({ success: true, item: updated[0] });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update menu item";
    res.status(500).json({ success: false, error: message });
  }
});

d1Router.delete("/menu/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await runD1Query("DELETE FROM menu_items WHERE id = ?", [id]);
    res.json({ success: true, message: `Menu item ${id} deleted` });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete menu item";
    res.status(500).json({ success: false, error: message });
  }
});

// 9. Aggregated Stats for Admin Dashboard
d1Router.get("/stats", async (req: Request, res: Response) => {
  try {
    const [ordersCount] = await runD1Query<{ count: number; revenue: number }>(
      "SELECT count(*) as count, coalesce(sum(grandTotal), 0) as revenue FROM orders"
    ).catch(() => [{ count: 0, revenue: 0 }]);
    const [bookingsCount] = await runD1Query<{ count: number }>(
      "SELECT count(*) as count FROM bookings"
    ).catch(() => [{ count: 0 }]);
    const [usersCount] = await runD1Query<{ count: number }>(
      "SELECT count(*) as count FROM users"
    ).catch(() => [{ count: 0 }]);
    const [staffCount] = await runD1Query<{ count: number }>(
      "SELECT count(*) as count FROM staff"
    ).catch(() => [{ count: 0 }]);
    const [ridersCount] = await runD1Query<{ count: number }>(
      "SELECT count(*) as count FROM riders"
    ).catch(() => [{ count: 0 }]);
    const [menuCount] = await runD1Query<{ count: number }>(
      "SELECT count(*) as count FROM menu_items"
    ).catch(() => [{ count: 0 }]);

    res.json({
      success: true,
      stats: {
        totalOrders: ordersCount?.count || 0,
        totalRevenue: ordersCount?.revenue || 0,
        totalBookings: bookingsCount?.count || 0,
        totalUsers: usersCount?.count || 0,
        totalStaff: staffCount?.count || 0,
        totalRiders: ridersCount?.count || 0,
        totalMenuItems: menuCount?.count || 0,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    res.status(500).json({ success: false, error: message });
  }
});

// Mount router on both /api/d1 and /d1 for full compatibility with Vercel and Standalone setups
app.use("/api/d1", d1Router);
app.use("/d1", d1Router);

// Health route at root api level
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", service: "The Grill Spot API", timestamp: new Date().toISOString() });
});

export default app;
