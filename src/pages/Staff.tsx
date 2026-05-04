import { useState } from "react";
import {type Counter, type StaffUser, usePos, useCurrentUser } from "../store/pos";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Pencil, Trash2, ShieldCheck, User as UserIcon, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";

export default function Staff() {
  const me = useCurrentUser();
  const { users, counters, addUser, updateUser, deleteUser, addCounter, updateCounter, deleteCounter } = usePos();

  if (!me || me.role !== "admin") return <Navigate to="/" replace />;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff & counters</h1>
        <p className="text-sm text-muted-foreground">Manage cashiers, admin accounts, and terminals</p>
      </div>

      <UsersSection
        users={users}
        addUser={addUser}
        updateUser={updateUser}
        deleteUser={deleteUser}
        meId={me.id}
      />

      <CountersSection
        counters={counters}
        addCounter={addCounter}
        updateCounter={updateCounter}
        deleteCounter={deleteCounter}
      />
    </div>
  );
}

const emptyUser: Omit<StaffUser, "id"> = {
  name: "",
  pin: "",
  role: "cashier",
  username: "",
  password: "",
  discountLimitPercent: 10,
  active: true,
};

function UsersSection({
  users,
  addUser,
  updateUser,
  deleteUser,
  meId,
}: {
  users: StaffUser[];
  addUser: (u: Omit<StaffUser, "id">) => void;
  updateUser: (id: string, p: Partial<StaffUser>) => void;
  deleteUser: (id: string) => void;
  meId: string;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StaffUser | null>(null);
  const [form, setForm] = useState<Omit<StaffUser, "id">>(emptyUser);

  const openAdd = () => { setEditing(null); setForm(emptyUser); setOpen(true); };
  const openEdit = (u: StaffUser) => {
    setEditing(u);
    const { id, ...rest } = u;
    setForm(rest);
    setOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return toast.error("Name required");
    if (!/^\d{4,6}$/.test(form.pin)) return toast.error("PIN must be 4–6 digits");
    if (form.role === "admin") {
      if (!form.username?.trim()) return toast.error("Username required for admin");
      if (!form.password || form.password.length < 6) return toast.error("Password must be at least 6 characters");
    }
    const payload: Omit<StaffUser, "id"> = {
      ...form,
      username: form.role === "admin" ? form.username?.trim() : undefined,
      password: form.role === "admin" ? form.password : undefined,
    };
    if (editing) {
      updateUser(editing.id, payload);
      toast.success("User updated");
    } else {
      addUser(payload);
      toast.success("User added");
    }
    setOpen(false);
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-base font-bold">Cashiers & admins</h2>
        <Button onClick={openAdd} className="bg-gradient-primary text-primary-foreground shadow-glow">
          <Plus className="mr-2 h-4 w-4" /> Add user
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>PIN</TableHead>
            <TableHead className="text-right">Discount limit</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <div className="flex items-center gap-2 font-medium">
                  {u.role === "admin" ? <ShieldCheck className="h-4 w-4 text-primary" /> : <UserIcon className="h-4 w-4 text-muted-foreground" />}
                  {u.name}
                  {u.id === meId && <Badge variant="secondary" className="text-[10px]">you</Badge>}
                </div>
              </TableCell>
              <TableCell><Badge variant="outline" className="capitalize">{u.role}</Badge></TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{"•".repeat(u.pin.length)}</TableCell>
              <TableCell className="text-right font-mono">{u.discountLimitPercent}%</TableCell>
              <TableCell>
                <Switch checked={u.active} onCheckedChange={(v) => updateUser(u.id, { active: v })} disabled={u.id === meId} />
              </TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" onClick={() => openEdit(u)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  disabled={u.id === meId}
                  onClick={() => { deleteUser(u.id); toast.success("User removed"); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "Add user"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Role</Label>
                <Select value={form.role} onValueChange={(v: "admin" | "cashier") => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashier">Cashier</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">PIN (4–6 digits)</Label>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pin}
                  onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })}
                />
              </div>
            </div>
            {form.role === "admin" && (
              <div className="grid grid-cols-2 gap-3 rounded-md border border-border bg-muted/30 p-3">
                <div className="col-span-2 -mb-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Admin login credentials
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Username</Label>
                  <Input
                    autoComplete="off"
                    value={form.username ?? ""}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Password</Label>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    value={form.password ?? ""}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Max discount % (without admin approval)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.discountLimitPercent}
                onChange={(e) => setForm({ ...form, discountLimitPercent: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label className="text-xs">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Add user"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function CountersSection({
  counters,
  addCounter,
  updateCounter,
  deleteCounter,
}: {
  counters: Counter[];
  addCounter: (c: Omit<Counter, "id">) => void;
  updateCounter: (id: string, p: Partial<Counter>) => void;
  deleteCounter: (id: string) => void;
}) {
  const [name, setName] = useState("");

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <MonitorSmartphone className="h-4 w-4" /> Counters
        </h2>
      </div>
      <div className="border-b border-border p-4">
        <div className="flex gap-2">
          <Input
            placeholder="New counter name (e.g. Counter #03)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button
            onClick={() => {
              if (!name.trim()) return;
              addCounter({ name: name.trim(), active: true });
              setName("");
              toast.success("Counter added");
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {counters.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium">{c.name}</TableCell>
              <TableCell>
                <Switch checked={c.active} onCheckedChange={(v) => updateCounter(c.id, { active: v })} />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => { deleteCounter(c.id); toast.success("Counter removed"); }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {counters.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">No counters yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
