import { useState } from "react";
import { D1Staff, createD1Staff, updateD1Staff, deleteD1Staff } from "@/lib/d1Api";
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
  Users,
  Plus,
  Search,
  Trash2,
  Edit2,
  Phone,
  Mail,
  ChefHat,
  Briefcase,
  Clock,
  Building,
  CheckCircle2,
  XCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface StaffManagementProps {
  staffList: D1Staff[];
  onRefresh: () => void;
}

const ROLES = [
  "Head Chef",
  "Branch Manager",
  "Line Cook (Grill Master)",
  "Host & Cashier",
  "Barista & Mocktail Specialist",
  "Waitstaff",
  "Kitchen Assistant",
  "Inventory Supervisor",
];

const SHIFTS = ["Morning (10:00 AM - 6:00 PM)", "Evening (5:00 PM - 1:00 AM)", "Night (8:00 PM - 4:00 AM)", "Full Day"];
const BRANCHES = ["Gulberg III (MM Alam)", "DHA Phase 5 (Bedian)", "Cantt Mall Road", "Model Town Link Rd"];

export const StaffManagement = ({ staffList, onRefresh }: StaffManagementProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<D1Staff | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [shift, setShift] = useState(SHIFTS[1]);
  const [status, setStatus] = useState<D1Staff["status"]>("on_duty");
  const [salary, setSalary] = useState("Rs. 65,000");

  const openAddModal = () => {
    setEditingStaff(null);
    setName("");
    setEmail("");
    setPhone("+92 3");
    setRole(ROLES[2]);
    setBranch(BRANCHES[0]);
    setShift(SHIFTS[1]);
    setStatus("on_duty");
    setSalary("Rs. 65,000");
    setIsDialogOpen(true);
  };

  const openEditModal = (staff: D1Staff) => {
    setEditingStaff(staff);
    setName(staff.name);
    setEmail(staff.email || "");
    setPhone(staff.phone || "");
    setRole(staff.role || ROLES[0]);
    setBranch(staff.branch || BRANCHES[0]);
    setShift(staff.shift || SHIFTS[0]);
    setStatus(staff.status || "active");
    setSalary(staff.salary || "Rs. 60,000");
    setIsDialogOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Staff name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingStaff) {
        await updateD1Staff(editingStaff.id, {
          name,
          email,
          phone,
          role,
          branch,
          shift,
          status,
          salary,
        });
        toast.success(`Updated staff details for ${name}`);
      } else {
        await createD1Staff({
          name,
          email,
          phone,
          role,
          branch,
          shift,
          status,
          salary,
        });
        toast.success(`Added ${name} to Lahore Restaurant Team`);
      }
      setIsDialogOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, staffName: string) => {
    if (window.confirm(`Are you sure you want to remove ${staffName} from staff records?`)) {
      await deleteD1Staff(id);
      toast.success(`Removed ${staffName} from staff`);
      onRefresh();
    }
  };

  const toggleDutyStatus = async (staff: D1Staff) => {
    const nextStatus = staff.status === "on_duty" ? "off_duty" : "on_duty";
    await updateD1Staff(staff.id, { status: nextStatus });
    toast.success(`${staff.name} is now marked ${nextStatus === "on_duty" ? "On Duty" : "Off Duty"}`);
    onRefresh();
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone && s.phone.includes(searchQuery));
    const matchesRole = roleFilter === "all" || s.role.toLowerCase().includes(roleFilter.toLowerCase());
    return matchesSearch && matchesRole;
  });

  const onDutyCount = staffList.filter((s) => s.status === "on_duty" || s.status === "active").length;

  return (
    <div className="space-y-4">
      {/* Top Banner & Action */}
      <Card className="p-4 border border-border shadow-soft bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-foreground">Restaurant Staff & Kitchen Crew</h3>
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px]">
                {onDutyCount} On Duty Now
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-light">
              Manage chefs, grill masters, shift managers, cashiers, and Lahore branch personnel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={openAddModal}
            className="h-9 px-4 text-xs font-normal bg-primary text-primary-foreground hover:bg-primary/90 rounded-md gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add New Staff
          </Button>
        </div>
      </Card>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff by name, role, phone, or branch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-9 bg-card border-border"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-9 px-3 text-xs rounded-md border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All Staff Roles ({staffList.length})</option>
          <option value="Chef">Chefs & Grill Masters</option>
          <option value="Manager">Managers</option>
          <option value="Cashier">Cashiers & Hosts</option>
          <option value="Waitstaff">Waitstaff</option>
        </select>
      </div>

      {/* Staff Table */}
      <Card className="border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/30">
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Staff Member</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Role & Position</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Branch / Shift</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Duty Status</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Contact</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal">Salary</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider font-normal text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs font-light">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40 stroke-1" />
                    No staff members match the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((staff) => {
                  const isOnDuty = staff.status === "on_duty" || staff.status === "active";
                  return (
                    <TableRow key={staff.id} className="border-border hover:bg-muted/20">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {staff.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">{staff.name}</p>
                            <p className="text-[10px] text-muted-foreground font-mono">ID: {staff.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <ChefHat className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="text-xs font-normal text-foreground">{staff.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-light space-y-0.5">
                          <p className="text-foreground flex items-center gap-1">
                            <Building className="w-3 h-3 text-muted-foreground" />
                            {staff.branch}
                          </p>
                          <p className="text-muted-foreground text-[11px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {staff.shift}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => toggleDutyStatus(staff)}
                          className="focus:outline-none"
                          title="Click to toggle duty status"
                        >
                          <Badge
                            variant="outline"
                            className={`text-[10px] cursor-pointer hover:opacity-80 transition-opacity ${
                              isOnDuty
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                : "bg-zinc-500/10 text-zinc-500 border-zinc-500/30"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                isOnDuty ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                              }`}
                            />
                            {isOnDuty ? "On Duty" : "Off Duty"}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs font-light">
                          {staff.phone && (
                            <a
                              href={`tel:${staff.phone}`}
                              className="text-foreground hover:text-primary flex items-center gap-1 font-mono text-[11px]"
                            >
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {staff.phone}
                            </a>
                          )}
                          {staff.email && (
                            <a
                              href={`mailto:${staff.email}`}
                              className="text-muted-foreground hover:text-primary flex items-center gap-1 text-[11px] truncate max-w-[140px]"
                            >
                              <Mail className="w-3 h-3" />
                              {staff.email}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium text-foreground font-mono">
                          {staff.salary || "—"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditModal(staff)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                            title="Edit Staff Member"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(staff.id, staff.name)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            title="Delete Staff"
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

      {/* Add / Edit Staff Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <form onSubmit={handleSaveStaff}>
            <DialogHeader>
              <DialogTitle className="text-base font-normal tracking-tight flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-primary" />
                {editingStaff ? "Edit Staff Member" : "Add New Staff Member"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-light">
                Configure staff position, schedule, branch assignment, and salary.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3.5 py-4 text-xs font-light">
              <div>
                <label className="block text-muted-foreground mb-1">Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Chef Tariq Mehmood"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-8 text-xs bg-background border-border"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Role / Designation</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1">Duty Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as D1Staff["status"])}
                    className="w-full h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground"
                  >
                    <option value="on_duty">On Duty</option>
                    <option value="off_duty">Off Duty</option>
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Branch</label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground"
                  >
                    {BRANCHES.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1">Shift Schedule</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full h-8 px-2 text-xs rounded-md border border-border bg-background text-foreground"
                  >
                    {SHIFTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground mb-1">Phone Number</label>
                  <Input
                    placeholder="+92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-8 text-xs bg-background border-border"
                  />
                </div>

                <div>
                  <label className="block text-muted-foreground mb-1">Monthly Salary (PKR)</label>
                  <Input
                    placeholder="Rs. 75,000"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="h-8 text-xs bg-background border-border"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground mb-1">Email Address (Optional)</label>
                <Input
                  type="email"
                  placeholder="staff@thegrillspot.pk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 text-xs bg-background border-border"
                />
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
                {isSubmitting ? "Saving..." : editingStaff ? "Update Staff" : "Add Staff Member"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
