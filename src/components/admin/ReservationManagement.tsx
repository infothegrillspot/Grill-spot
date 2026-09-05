import { useState, useEffect } from "react";
import { D1Booking, updateD1BookingStatus, deleteD1Booking } from "@/lib/d1Api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  Users,
  Clock,
  Phone,
  Mail,
  MapPin,
  Trash2,
  CheckCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";

interface ReservationManagementProps {
  bookingsList?: D1Booking[];
  bookings?: D1Booking[];
  onRefresh: () => void;
}

export const ReservationManagement = ({
  bookingsList,
  bookings,
  onRefresh,
}: ReservationManagementProps) => {
  const [localBookings, setLocalBookings] = useState<D1Booking[]>(() => bookingsList || bookings || []);

  useEffect(() => {
    setLocalBookings(bookingsList || bookings || []);
  }, [bookingsList, bookings]);

  const effectiveBookings = localBookings;
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleStatusChange = async (id: string, status: string) => {
    const previousBookings = localBookings;
    const typedStatus = status as D1Booking["status"];

    // 1. Instant optimistic update
    setLocalBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: typedStatus } : b))
    );

    try {
      const ok = await updateD1BookingStatus(id, status);
      if (ok) {
        toast.success(`Booking status updated to ${status}`);
      } else {
        throw new Error("Failed to update status on server");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status, reverting");
      setLocalBookings(previousBookings);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(`Delete reservation ${id}?`)) {
      await deleteD1Booking(id);
      toast.success("Reservation deleted");
      onRefresh();
    }
  };

  const filtered = effectiveBookings.filter((b) => {
    const matchesSearch =
      (b.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.phone || "").includes(searchQuery) ||
      (b.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.area && b.area.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reservations by guest name, phone, email, area..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9 bg-card border-border"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 text-xs rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Bookings ({effectiveBookings.length})</option>
          <option value="confirmed">Confirmed</option>
          <option value="seated">Seated</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <Card className="border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/30">
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Guest Name</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Date & Time</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Party Size</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Dining Area</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Contact</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs font-light">
                    <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40 stroke-1" />
                    No table reservations found matching the filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((b) => (
                  <TableRow key={b.id} className="border-border hover:bg-muted/20">
                    <TableCell>
                      <div>
                        <p className="text-xs font-medium text-foreground">{b.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">ID: {b.id}</p>
                        {b.specialRequests && (
                          <p className="text-[10px] text-amber-600 bg-amber-500/10 px-1 rounded mt-1 italic line-clamp-1">
                            {b.specialRequests}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-light space-y-0.5">
                        <p className="text-foreground">{b.date}</p>
                        <p className="text-muted-foreground text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {b.time}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px] font-normal gap-1">
                        <Users className="w-3 h-3 text-primary" />
                        {b.guests} Guests
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-foreground font-light flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {b.area || "Main Hall"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-light space-y-0.5 font-mono">
                        {b.phone && (
                          <a href={`tel:${b.phone}`} className="text-foreground hover:text-primary flex items-center gap-1 text-[11px]">
                            <Phone className="w-3 h-3 text-muted-foreground" />
                            {b.phone}
                          </a>
                        )}
                        {b.email && (
                          <a href={`mailto:${b.email}`} className="text-muted-foreground hover:text-primary flex items-center gap-1 text-[10px] truncate max-w-[130px]">
                            <Mail className="w-3 h-3" />
                            {b.email}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <select
                        value={b.status}
                        onChange={(e) => handleStatusChange(b.id, e.target.value)}
                        className={`h-7 px-2 text-[11px] font-medium rounded border cursor-pointer ${
                          b.status === "confirmed"
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                            : b.status === "seated"
                            ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
                            : "bg-muted text-foreground border-border"
                        }`}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="seated">Seated</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(b.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
