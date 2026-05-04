import { useMemo } from "react";
import { usePos } from "../store/pos";
import { Card } from "../components/ui/card";
import { formatCurrency, formatDateShort } from "../lib/format";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from "recharts";
import { DollarSign, ShoppingBag, TrendingUp, Package } from "lucide-react";

export default function Dashboard() {
  const { sales, products } = usePos();

  const stats = useMemo(() => {
    const totalRevenue = sales.reduce((s, x) => s + x.total, 0);
    const orders = sales.length;
    const avg = orders ? totalRevenue / orders : 0;
    const lowStock = products.filter((p) => p.stock <= 8).length;
    return { totalRevenue, orders, avg, lowStock };
  }, [sales, products]);

  const last7 = useMemo(() => {
    const days: { date: string; revenue: number; orders: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const next = new Date(d);
      next.setDate(d.getDate() + 1);
      const dailySales = sales.filter((s) => {
        const t = new Date(s.createdAt).getTime();
        return t >= d.getTime() && t < next.getTime();
      });
      days.push({
        date: formatDateShort(d),
        revenue: +dailySales.reduce((sum, s) => sum + s.total, 0).toFixed(2),
        orders: dailySales.length,
      });
    }
    return days;
  }, [sales]);

  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
    sales.forEach((s) =>
      s.items.forEach((it) => {
        if (!counts[it.productId])
          counts[it.productId] = { name: it.name, qty: 0, revenue: 0 };
        counts[it.productId].qty += it.quantity;
        counts[it.productId].revenue += it.price * it.quantity;
      })
    );
    return Object.values(counts)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Performance overview · last 7 days</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={DollarSign} label="Total revenue" value={formatCurrency(stats.totalRevenue)} accent />
        <Stat icon={ShoppingBag} label="Orders" value={stats.orders.toString()} />
        <Stat icon={TrendingUp} label="Avg. order" value={formatCurrency(stats.avg)} />
        <Stat icon={Package} label="Low stock items" value={stats.lowStock.toString()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold">Revenue trend</h3>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-base font-bold">Top products</h3>
          <div className="space-y-3">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-foreground">
                  {i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.qty} sold</div>
                </div>
                <span className="text-sm font-mono font-semibold">{formatCurrency(p.revenue)}</span>
              </div>
            ))}
            {topProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">No sales yet.</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h3 className="mb-4 text-base font-bold">Orders per day</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card className={`p-5 ${accent ? "bg-gradient-primary text-primary-foreground" : ""}`}>
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${accent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          {label}
        </span>
        <Icon className={`h-4 w-4 ${accent ? "text-primary-foreground/80" : "text-muted-foreground"}`} />
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight font-mono">{value}</div>
    </Card>
  );
}
