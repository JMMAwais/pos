import { useEffect, useState } from "react";
import { usePos } from "@/store/pos";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Store, ShieldCheck, User as UserIcon, Delete, LogIn } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function LoginScreen() {
  const { users, counters, login, loginAdmin } = usePos();
  const activeCashiers = users.filter((u) => u.active && u.role === "cashier");
  const activeCounters = counters.filter((c) => c.active);
  const navigate = useNavigate(); 
  const [tab, setTab] = useState<"cashier" | "admin">("cashier");
  const [counterId, setCounterId] = useState<string>(() => {
    return localStorage.getItem("pos-last-counter") || activeCounters[0]?.id || "";
  });

  useEffect(() => {
    if (counterId) localStorage.setItem("pos-last-counter", counterId);
  }, [counterId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md p-6 shadow-soft">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold">Northwind POS</h1>
          <p className="text-xs text-muted-foreground">Sign in to start your shift</p>
        </div>

        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Counter</label>
          <Select value={counterId} onValueChange={setCounterId}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select counter" />
            </SelectTrigger>
            <SelectContent>
              {activeCounters.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "cashier" | "admin")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="cashier" className="gap-1.5">
              <UserIcon className="h-3.5 w-3.5" /> Cashier
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cashier" className="mt-4">
            <CashierPinForm
              cashiers={activeCashiers}
              counterId={counterId}
              onLogin={login}
              navigate={navigate}
            />
          </TabsContent>

          <TabsContent value="admin" className="mt-4">
            <AdminLoginForm counterId={counterId} onLogin={loginAdmin} navigate={navigate}/>
          </TabsContent>
        </Tabs>

        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          Demo · Cashiers: Alex 1111 · Jordan 2222 · Admin: <span className="font-mono">admin</span> / <span className="font-mono">admin123</span>
        </p>
      </Card>
    </div>
  );
}

function CashierPinForm({
  cashiers,
  counterId,
  onLogin,
   navigate,
}: {
  cashiers: ReturnType<typeof usePos.getState>["users"];
  counterId: string;
  onLogin: (userId: string, pin: string, counterId: string) => boolean;
    navigate: (path: string) => void;
}) {
  const [userId, setUserId] = useState<string>(cashiers[0]?.id ?? "");
  const [pin, setPin] = useState("");

  const selectedUser = cashiers.find((u) => u.id === userId);

  const submit = (value: string) => {
    if (!userId || !counterId) {
      toast.error("Select cashier and counter");
      return;
    }
    if (value.length < 4) return;
    const ok = onLogin(userId, value, counterId);
    if (!ok) {
      toast.error("Wrong PIN");
      setPin("");
    } else {
      toast.success(`Welcome, ${selectedUser?.name}`);
      navigate("/pos");
    }
  };

  const press = (k: string) => {
    if (k === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    setPin((p) => {
      const next = (p + k).slice(0, 6);
      if (next.length === 4) submit(next);
      return next;
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Cashier</Label>
        <Select value={userId} onValueChange={(v) => { setUserId(v); setPin(""); }}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Select cashier" />
          </SelectTrigger>
          <SelectContent>
            {cashiers.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                <span className="flex items-center gap-2">
                  <UserIcon className="h-3.5 w-3.5" />
                  {u.name}
                  <Badge variant="outline" className="ml-1 text-[10px]">cashier</Badge>
                </span>
              </SelectItem>
            ))}
            {cashiers.length === 0 && (
              <div className="p-2 text-xs text-muted-foreground">No active cashiers</div>
            )}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="mb-1.5 block text-xs font-semibold text-muted-foreground">PIN</Label>
        <div className="flex justify-center py-2">
          <InputOTP maxLength={6} value={pin} onChange={(v) => { setPin(v); if (v.length >= 4) submit(v); }}>
            <InputOTPGroup>
              {Array.from({ length: 4 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-12 text-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <div className="mx-auto mt-3 grid max-w-[260px] grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9"].map((k) => (
            <Button key={k} variant="outline" className="h-12 text-base font-mono" onClick={() => press(k)}>{k}</Button>
          ))}
          <Button variant="ghost" className="h-12" onClick={() => setPin("")}>C</Button>
          <Button variant="outline" className="h-12 text-base font-mono" onClick={() => press("0")}>0</Button>
          <Button variant="ghost" className="h-12" onClick={() => press("del")}><Delete className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}

function AdminLoginForm({
  counterId,
  onLogin,
  navigate
}: {
  counterId: string;
  onLogin: (username: string, password: string, counterId: string) => boolean;
    navigate: (path: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!counterId) return toast.error("Select a counter");
    if (!username.trim() || !password) return toast.error("Enter username and password");
    const ok = onLogin(username, password, counterId);
    if (!ok) {
      toast.error("Invalid admin credentials");
      setPassword("");
    } else {
      toast.success("Welcome back, admin");
       navigate("/pos");
    }
  };

  return (
    <form className="space-y-3" onSubmit={submit}>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Username</Label>
        <Input
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
          className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Password</Label>
        <Input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="h-11"
        />
      </div>
      <Button type="submit" className="h-11 w-full bg-gradient-primary text-primary-foreground shadow-glow">
        <LogIn className="mr-2 h-4 w-4" /> Sign in as admin
      </Button>
    </form>
  );
}
