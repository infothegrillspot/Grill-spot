import { useState } from "react";
import { D1Rider, createD1Rider, updateD1Rider, deleteD1Rider } from "@/lib/d1Api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Bike,
  Plus,
  Search,
  Trash2,
  Edit2,
  Phone,
  MessageSquare,
  Navigation,
  Star,
  CheckCircle,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface RiderManagementProps {
  ridersList?: D1Rider[];
  riders?: D1Rider[];
  orders?: unknown[];
  onRefresh: () => void;
}

const VEHICLE_TYPES = [
  "Motorbike (Honda 125)",
  "Motorbike (Yamaha YBR)",
  "Motorbike (Suzuki GS 150)",
  "Scooter (Electric EV)",
  "Car / Van (Catering)",
];

const ZONES = [
  "Gulberg & Main Boulevard",
  "DHA Phase 1-6 & Cantt",
  "Model Town & Garden Town",
  "Johar Town & Faisal Town",
  "All Lahore Sectors",
];

export const RiderManagement = ({ ridersList, riders, onRefresh }: RiderManagementProps) => {
  const effectiveRiders = ridersList || riders || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRider, setEditingRider] = useState<D1Rider | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+92 3");
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0]);
  const [vehiclePlate, setVehiclePlate] = useState("LEA-");
  const [assignedZone, setAssignedZone] = useState(ZONES[0]);
  const [status, setStatus] = useState<D1Rider["status"]>("available");

  const openAddModal = () => {
    setEditingRider(null);
    setName("");
    setPhone("+92 3");
    setVehicleType(VEHICLE_TYPES[0]);
    setVehiclePlate("LEA-");
    setAssignedZone(ZONES[0]);
    setStatus("available");
    setIsDialogOpen(true);
  };

  const openEditModal = (rider: D1Rider) => {
    setEditingRider(rider);
    setName(rider.name);
    setPhone(rider.phone);
    setVehicleType(rider.vehicleType || VEHICLE_TYPES[0]);
    setVehiclePlate(rider.vehiclePlate || "");
    setAssignedZone(rider.assignedZone || ZONES[0]);
    setStatus(rider.status || "available");
    setIsDialogOpen(true);
  };

  const handleSaveRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error("Rider name and phone number are required");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingRider) {
        await updateD1Rider(editingRider.id, {
          name,
          phone,
          vehicleType,
          vehiclePlate,
          assignedZone,
          status,
        });
        toast.success(`Updated rider details for ${name}`);
      } else {
        await createD1Rider({
          name,
          phone,
          vehicleType,
          vehiclePlate,
          assignedZone,
          status,
          activeDeliveries: 0,
          rating: 4.9,
        });
        toast.success(`Registered new delivery rider: ${name}`);
      }
      setIsDialogOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save rider");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, riderName: string) => {
    if (window.confirm(`Are you sure you want to remove rider ${riderName}?`)) {
      await deleteD1Rider(id);
      toast.success(`Removed ${riderName} from delivery fleet`);
      onRefresh();
    }
  };

  const toggleRiderStatus = async (rider: D1Rider) => {
    const nextStatus = rider.status === "available" ? "delivering" : rider.status === "delivering" ? "on_break" : "available";
    await updateD1Rider(rider.id, { status: nextStatus });
    toast.success(`Rider ${rider.name} status updated to ${nextStatus}`);
    onRefresh();
  };

  const filteredRiders = effectiveRiders.filter((r) => {
    const matchesSearch =
      (r.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.phone || "").includes(searchQuery) ||
      (r.vehiclePlate && r.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.assignedZone || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableCount = effectiveRiders.filter((r) => r.status === "available").length;
  const deliveringCount = effectiveRiders.filter((r) => r.status === "delivering").length;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <Card className="p-4 border border-border shadow-soft bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-foreground">Delivery Fleet & Riders (Lahore)</h3>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                {availableCount} Available Now
              </Badge>
              {deliveringCount > 0 && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">
                  {deliveringCount} On Delivery
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-light">
              Allocate incoming online orders to available riders with one click
            </p>
          </div>
        </div>

        <Button
          onClick={openAddModal}
          className="h-9 px-4 text-xs font-normal bg-primary text-primary-foreground hover:bg-primary/90 rounded-md gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Register New Rider
        </Button>
      </Card>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search riders by name, phone, plate, or assigned sector..."
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
          <option value="all">All Riders ({effectiveRiders.length})</option>
          <option value="available">Available ({availableCount})</option>
          <option value="delivering">Out for Delivery ({deliveringCount})</option>
          <option value="on_break">On Break</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {/* Riders Table */}
      <Card className="border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/30">
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Rider Info</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Vehicle & Plate</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Assigned Zone</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Availability</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Active Deliveries</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Quick Contact</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRiders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs font-light">
                    <Bike className="w-8 h-8 mx-auto mb-2 opacity-40 stroke-1" />
                    No delivery riders found matching your filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRiders.map((rider) => {
                  const isAvail = rider.status === "available";
                  const isDeliv = rider.status === "delivering";
                  const cleanPhone = rider.phone.replace(/[^0-9]/g, "");

                  return (
                    <TableRow key={rider.id} className="border-border hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            <Bike className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">{rider.name}</p>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                              <span>{rider.rating || 4.9}</span>
                              <span>•</span>
                              <span className="font-mono">ID: {rider.id}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-light space-y-0.5">
                          <p className="text-foreground">{rider.vehicleType}</p>
                          <p className="text-muted-foreground font-mono text-[11px]">
                            Plate: {rider.vehiclePlate || "N/A"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs text-foreground font-light">
                          <Navigation className="w-3 h-3 text-primary flex-shrink-0" />
                          <span>{rider.assignedZone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => toggleRiderStatus(rider)}
                          className="focus:outline-none"
                          title="Click to cycle status"
                        >
                          <Badge
                            variant="outline"
                            className={`text-[10px] cursor-pointer hover:opacity-80 transition-opacity ${
                              isAvail
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                : isDeliv
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/30"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                isAvail
                                  ? "bg-emerald-500 animate-pulse"
                                  : isDeliv
                                  ? "bg-amber-500 animate-pulse"
                                  : "bg-zinc-400"
                              }`}
                            />
                            {rider.status.replace("_", " ")}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-[11px] font-normal">
                          {rider.activeDeliveries || 0} active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${rider.phone}`}
                            className="p-1.5 rounded bg-muted hover:bg-primary/20 hover:text-primary transition-colors text-muted-foreground"
                            title={`Call ${rider.name}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(rider.name)}%2C%20The%20Grill%20Spot%20Dispatch%20calling%20regarding%20an%20order.`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-colors"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                          <span className="text-[11px] font-mono text-muted-foreground ml-1">{rider.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(rider)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            title="Edit Rider"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(rider.id, rider.name)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="Delete Rider"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add / Edit Rider Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <form onSubmit={handleSaveRider}>
            <DialogHeader>
              <DialogTitle className="text-base font-normal tracking-tight flex items-center gap-2">
                <Bike className="w-4 h-4 text-blue-500" />
                {editingRider ? "Edit Delivery Rider" : "Register New Delivery Rider"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-light">
                Add rider contact and vehicle details for instant order allocation.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 py-4 text-xs font-light">
              <div>
                <label className="block text-muted-foreground mb-1">Rider Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Usman Khan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 text-xs bg-background border-border"
                />
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Mobile / WhatsApp Number *</label>
                <Input
                  required
                  placeholder="+92 300 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-8 text-xs bg-background border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Vehicle Type</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground"
                  >
                    {VEHICLE_TYPES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1">Number Plate</label>
                  <Input
                    placeholder="LEA-9012"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className="h-8 text-xs bg-background border-border"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Assigned Lahore Zone</label>
                  <select
                    value={assignedZone}
                    onChange={(e) => setAssignedZone(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground"
                  >
                    {ZONES.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as D1Rider["status"])}
                    className="w-full h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground"
                  >
                    <option value="available">Available</option>
                    <option value="delivering">Out for Delivery</option>
                    <option value="on_break">On Break</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsDialogOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? "Saving..." : editingRider ? "Update Rider" : "Register Rider"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
