import { useState } from "react";
import {
  D1Order,
  D1Rider,
  allocateOrderToRider,
  updateD1OrderStatus,
  deleteD1Order,
} from "@/lib/d1Api";
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
  ShoppingBag,
  Bike,
  Phone,
  MapPin,
  MessageSquare,
  Copy,
  Clock,
  CheckCircle2,
  Trash2,
  Search,
  User,
  ChevronRight,
  Send,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface OrderManagementProps {
  ordersList: D1Order[];
  ridersList: D1Rider[];
  onRefresh: () => void;
}

export const OrderManagement = ({
  ordersList,
  ridersList,
  onRefresh,
}: OrderManagementProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<D1Order | null>(null);
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [isAllocating, setIsAllocating] = useState(false);

  const openAllocateModal = (order: D1Order) => {
    setSelectedOrder(order);
    // Auto-select first available rider if possible
    const firstAvail = ridersList.find((r) => r.status === "available") || ridersList[0];
    setSelectedRiderId(firstAvail?.id || "");
    setIsAllocateModalOpen(true);
  };

  const handleAllocate = async () => {
    if (!selectedOrder || !selectedRiderId) {
      toast.error("Please select a delivery rider");
      return;
    }

    const rider = ridersList.find((r) => r.id === selectedRiderId);
    if (!rider) {
      toast.error("Rider not found");
      return;
    }

    setIsAllocating(true);
    try {
      const success = await allocateOrderToRider(
        selectedOrder.id,
        rider.id,
        rider.name,
        rider.phone,
        "out_for_delivery"
      );

      if (success) {
        toast.success(`Order ${selectedOrder.id} assigned to ${rider.name}!`);
        setIsAllocateModalOpen(false);
        onRefresh();
      } else {
        toast.error("Failed to allocate order");
      }
    } catch (err) {
      console.error(err);
      toast.error("Allocation error occurred");
    } finally {
      setIsAllocating(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const ok = await updateD1OrderStatus(orderId, newStatus);
      if (ok) {
        toast.success(`Order ${orderId} updated to ${newStatus.replace("_", " ")}`);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (orderId: string) => {
    if (window.confirm(`Are you sure you want to delete order ${orderId}?`)) {
      await deleteD1Order(orderId);
      toast.success(`Order ${orderId} deleted`);
      onRefresh();
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`);
  };

  const filteredOrders = ordersList.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.phone.includes(searchQuery) ||
      order.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.riderName && order.riderName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = ordersList.filter((o) => o.status === "pending").length;
  const deliveringCount = ordersList.filter((o) => o.status === "out_for_delivery").length;

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <Card className="p-4 border border-border shadow-soft bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-foreground">Live Customer Orders & Dispatch</h3>
              {pendingCount > 0 && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px] animate-pulse">
                  {pendingCount} Needs Rider
                </Badge>
              )}
              {deliveringCount > 0 && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 text-[10px]">
                  {deliveringCount} On Way
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-light">
              View customer delivery address, contact number, order items, and assign orders to riders
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="text-xs h-8"
          >
            Refresh Orders
          </Button>
        </div>
      </Card>

      {/* Filter Tabs & Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer name, phone, address, or assigned rider..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-card border-border"
            />
          </div>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: `All Orders (${ordersList.length})` },
            { id: "pending", label: `Pending Dispatch (${ordersList.filter((o) => o.status === "pending").length})` },
            { id: "preparing", label: `Preparing in Kitchen (${ordersList.filter((o) => o.status === "preparing").length})` },
            { id: "out_for_delivery", label: `Out for Delivery (${ordersList.filter((o) => o.status === "out_for_delivery").length})` },
            { id: "delivered", label: `Delivered (${ordersList.filter((o) => o.status === "delivered" || o.status === "completed").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <Card className="border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/30">
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Order ID & Time</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Customer Details</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Delivery Address</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Items & Total</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Assigned Rider</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs font-light">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40 stroke-1" />
                    No orders found matching the filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const cleanPhone = order.phone?.replace(/[^0-9]/g, "") || "";
                  const itemCount = Array.isArray(order.items)
                    ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
                    : 1;

                  const isPending = order.status === "pending";
                  const isOut = order.status === "out_for_delivery";
                  const isDelivered = order.status === "delivered" || order.status === "completed";

                  return (
                    <TableRow key={order.id} className="border-border hover:bg-muted/20">
                      {/* 1. Order ID & Time */}
                      <TableCell>
                        <div>
                          <p className="text-xs font-mono font-medium text-foreground">{order.id}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
                                " • " +
                                new Date(order.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })
                              : "Just now"}
                          </p>
                          <Badge variant="outline" className="text-[9px] uppercase mt-1">
                            {order.orderType || "Delivery"}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* 2. Customer Name & Phone */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-medium text-xs text-foreground">
                            <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                            <span>{order.customerName || "Valued Customer"}</span>
                          </div>
                          {order.phone && (
                            <div className="flex items-center gap-1">
                              <a
                                href={`tel:${order.phone}`}
                                className="text-[11px] font-mono text-foreground hover:text-primary flex items-center gap-1"
                              >
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                {order.phone}
                              </a>
                              <a
                                href={`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(order.customerName || "Customer")}%2C%20The%20Grill%20Spot%20Lahore%20is%20processing%20your%20order%20%23${order.id}.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 ml-1"
                                title="WhatsApp Customer"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* 3. Delivery Address */}
                      <TableCell className="max-w-[220px]">
                        <div className="space-y-1">
                          <div className="flex items-start gap-1 text-xs text-foreground font-light">
                            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                            <p className="line-clamp-2 leading-tight text-[11px]">
                              {order.address || "No delivery address specified (Pickup)"}
                            </p>
                          </div>
                          {order.address && (
                            <button
                              type="button"
                              onClick={() => copyToClipboard(order.address, "Delivery Address")}
                              className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 font-light"
                            >
                              <Copy className="w-2.5 h-2.5" /> Copy address
                            </button>
                          )}
                          {order.specialInstructions && (
                            <p className="text-[10px] text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded italic line-clamp-1">
                              Note: {order.specialInstructions}
                            </p>
                          )}
                        </div>
                      </TableCell>

                      {/* 4. Items & Total */}
                      <TableCell>
                        <div>
                          <p className="text-xs font-bold text-foreground font-mono">
                            Rs. {Number(order.grandTotal || 0).toLocaleString()}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailsModalOpen(true);
                            }}
                            className="text-[11px] text-primary hover:underline flex items-center gap-0.5 mt-0.5"
                          >
                            <span>{itemCount} item(s)</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </TableCell>

                      {/* 5. Assigned Rider */}
                      <TableCell>
                        {order.riderName ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 text-xs font-medium text-blue-600">
                              <Bike className="w-3.5 h-3.5" />
                              <span>{order.riderName}</span>
                            </div>
                            {order.riderPhone && (
                              <p className="text-[10px] font-mono text-muted-foreground">{order.riderPhone}</p>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openAllocateModal(order)}
                              className="h-5 text-[10px] px-1 text-muted-foreground hover:text-primary underline p-0"
                            >
                              Reallocate
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => openAllocateModal(order)}
                            className="h-7 text-xs px-2.5 bg-blue-600 text-white hover:bg-blue-700 font-normal gap-1"
                          >
                            <Bike className="w-3.5 h-3.5" />
                            Allocate Rider
                          </Button>
                        )}
                      </TableCell>

                      {/* 6. Status Selector */}
                      <TableCell>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`h-7 px-2 text-[11px] font-medium rounded border cursor-pointer ${
                            isPending
                              ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
                              : isOut
                              ? "bg-blue-500/10 text-blue-700 border-blue-500/30"
                              : isDelivered
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30"
                              : "bg-muted text-foreground border-border"
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="preparing">Preparing</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </TableCell>

                      {/* 7. Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(order.id)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="Delete order"
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

      {/* Allocate Rider Modal */}
      <Dialog open={isAllocateModalOpen} onOpenChange={setIsAllocateModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-normal tracking-tight flex items-center gap-2">
              <Bike className="w-4 h-4 text-blue-500" />
              Allocate Order #{selectedOrder?.id} to Rider
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-light">
              Select an active delivery rider from your fleet in Lahore.
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-3 text-xs">
              {/* Order Quick Summary */}
              <div className="p-3 rounded-md bg-muted/40 border border-border space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-foreground">{selectedOrder.customerName}</span>
                  <span className="font-bold text-primary font-mono">
                    Rs. {Number(selectedOrder.grandTotal).toLocaleString()}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                  <Phone className="w-3 h-3" /> {selectedOrder.phone}
                </p>
                <p className="text-[11px] text-foreground flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{selectedOrder.address}</span>
                </p>
              </div>

              {/* Rider Selection List */}
              <div className="space-y-2">
                <label className="block text-muted-foreground text-xs">Choose Fleet Rider:</label>
                {ridersList.length === 0 ? (
                  <p className="text-amber-500 text-xs">
                    No riders registered yet. Please add a rider in the "Riders Fleet" tab first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {ridersList.map((rider) => {
                      const isSelected = selectedRiderId === rider.id;
                      const isAvail = rider.status === "available";
                      return (
                        <div
                          key={rider.id}
                          onClick={() => setSelectedRiderId(rider.id)}
                          className={`p-3 rounded-md border cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border bg-card hover:bg-muted/30"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{rider.name}</span>
                              <Badge
                                variant="outline"
                                className={`text-[9px] ${
                                  isAvail
                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                    : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                }`}
                              >
                                {rider.status}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-mono">{rider.phone}</p>
                            <p className="text-[10px] text-muted-foreground">{rider.assignedZone}</p>
                          </div>

                          <div className="text-right text-[11px] font-mono text-muted-foreground">
                            {rider.activeDeliveries || 0} active
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAllocateModalOpen(false)}
              className="text-xs h-8"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isAllocating || !selectedRiderId}
              onClick={handleAllocate}
              size="sm"
              className="text-xs h-8 bg-blue-600 text-white hover:bg-blue-700"
            >
              {isAllocating ? "Assigning..." : "Confirm & Dispatch Rider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Itemized Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-base font-normal tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-primary" />
              Order Items Breakdown #{selectedOrder?.id}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-light">
              Customer: {selectedOrder?.customerName} • Phone: {selectedOrder?.phone}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-2 text-xs">
              <div className="border border-border rounded-md divide-y divide-border">
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-foreground">
                          {item.quantity}x {item.name}
                        </span>
                        {item.notes && <p className="text-[10px] text-muted-foreground italic">{item.notes}</p>}
                      </div>
                      <span className="font-mono text-foreground">
                        Rs. {(Number(item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-muted-foreground">Standard Platter Order</div>
                )}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border font-light">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">Rs. {Number(selectedOrder.subtotal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Charge</span>
                  <span className="font-mono">Rs. {Number(selectedOrder.deliveryFee || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-foreground pt-1 border-t border-border">
                  <span>Grand Total</span>
                  <span className="font-mono text-primary">
                    Rs. {Number(selectedOrder.grandTotal || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDetailsModalOpen(false)}
              className="text-xs h-8"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
