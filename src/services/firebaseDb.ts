import { 
  db 
} from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  Timestamp 
} from "firebase/firestore";

export interface BookingRecord {
  id?: string;
  name: string;
  email: string;
  phone: string;
  guests: number;
  date: string;
  time: string;
  area: string;
  notes?: string;
  status: "confirmed" | "cancelled" | "pending";
  createdAt?: string | Timestamp;
  userId?: string;
}

export interface OrderRecord {
  id?: string;
  items: Array<{ id: string; name: string; price: number; quantity: number; notes?: string }>;
  orderType: "dinein" | "takeaway" | "delivery";
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  customerName?: string;
  phone?: string;
  address?: string;
  specialInstructions?: string;
  status: "pending" | "preparing" | "delivering" | "completed" | "cancelled";
  createdAt?: string | Timestamp;
  userId?: string;
}

const BOOKINGS_COLLECTION = "bookings";
const ORDERS_COLLECTION = "orders";

// ---------------- BOOKINGS ----------------

export async function saveBookingToFirestore(booking: Omit<BookingRecord, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), {
      ...booking,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.warn("Firestore save booking error, using local fallback:", error);
    // Return random ID if offline
    return "local-" + Math.random().toString(36).substring(2, 9);
  }
}

export function subscribeToBookings(callback: (bookings: BookingRecord[]) => void) {
  try {
    const q = query(collection(db, BOOKINGS_COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const bookings: BookingRecord[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || data.customerName || "Customer",
          email: data.email || "",
          phone: data.phone || "",
          guests: Number(data.guests || 2),
          date: data.date || "",
          time: data.time || "",
          area: data.area || data.location || "Gulberg III",
          notes: data.notes || "",
          status: data.status || "confirmed",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          userId: data.userId,
        };
      });
      callback(bookings);
    }, (error) => {
      console.warn("Bookings subscription error:", error);
    });
  } catch (err) {
    console.warn("Could not initiate bookings listener:", err);
    return () => {};
  }
}

export async function updateBookingStatusInFirestore(bookingId: string, status: "confirmed" | "cancelled" | "pending") {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.warn("Could not update booking in Firestore:", error);
  }
}

export async function deleteBookingFromFirestore(bookingId: string) {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn("Could not delete booking from Firestore:", error);
  }
}

// ---------------- ORDERS ----------------

export async function saveOrderToFirestore(order: Omit<OrderRecord, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...order,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.warn("Firestore save order error, using local fallback:", error);
    return "order-" + Math.random().toString(36).substring(2, 9);
  }
}

export function subscribeToOrders(callback: (orders: OrderRecord[]) => void) {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const orders: OrderRecord[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          items: data.items || [],
          orderType: data.orderType || "dinein",
          subtotal: Number(data.subtotal || 0),
          deliveryFee: Number(data.deliveryFee || 0),
          grandTotal: Number(data.grandTotal || 0),
          customerName: data.customerName || "Customer",
          phone: data.phone || "",
          address: data.address || "",
          specialInstructions: data.specialInstructions || "",
          status: data.status || "pending",
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
          userId: data.userId,
        };
      });
      callback(orders);
    }, (error) => {
      console.warn("Orders subscription error:", error);
    });
  } catch (err) {
    console.warn("Could not initiate orders listener:", err);
    return () => {};
  }
}

export async function updateOrderStatusInFirestore(orderId: string, status: OrderRecord["status"]) {
  try {
    const docRef = doc(db, ORDERS_COLLECTION, orderId);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.warn("Could not update order in Firestore:", error);
  }
}
