import { useState } from "react";
import { usePos, type Sale, useCurrentUser } from "../store/pos";
import { Card } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Receipt as ReceiptIcon, Ban } from "lucide-react";
import { formatCurrency, formatDate } from "../lib/format";
import { ReceiptDialog } from "../components/ReceiptDialog";
import { AdminPinDialog } from "../components/AdminPinDialog";
import { toast } from "sonner";

export default function Sales() {
  const { sales, voidSale } = usePos();
  const me = useCurrentUser();
  const [selected, setSelected] = useState<Sale | null>(null);
  const [voidTarget, setVoidTarget] = useState<Sale | null>(null);

  const visible = me?.role === "admin"
    ? sales
    : sales.filter((s) => s.cashierId === me?.id);

  const sorted = [...visible].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalToday = sorted
    .filter((s) => !s.voided && new Date(s.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales history</h1>
          <p className="text-sm text-muted-foreground">
            {me?.role === "admin" ? "All cashiers" : "Your sales"} · {sorted.length} transactions · today {formatCurrency(totalToday)}
          </p>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Cashier</TableHead>
              <TableHead>Counter</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((s) => (
              <TableRow key={s.id} className={s.voided ? "opacity-50" : undefined}>
                <TableCell className="font-mono text-xs">
                  #{s.id.slice(-8).toUpperCase()}
                  {s.voided && <Badge variant="destructive" className="ml-2 text-[10px]">VOID</Badge>}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(s.createdAt)}</TableCell>
                <TableCell className="text-sm">{s.cashier}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.counterName ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">{s.paymentMethod}</Badge>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {s.items.reduce((n, it) => n + it.quantity, 0)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">{formatCurrency(s.total)}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => setSelected(s)}>
                    <ReceiptIcon className="h-4 w-4" />
                  </Button>
                  {!s.voided && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setVoidTarget(s)}
                      title="Void sale (admin)"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No sales yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <ReceiptDialog sale={selected} open={!!selected} onOpenChange={(o) => !o && setSelected(null)} />

      <AdminPinDialog
        open={!!voidTarget}
        onOpenChange={(o) => !o && setVoidTarget(null)}
        title="Void sale"
        description={voidTarget ? `Reverse sale of ${formatCurrency(voidTarget.total)}? Stock will be restored.` : undefined}
        onApproved={(pin) => {
          if (!voidTarget) return;
          if (voidSale(voidTarget.id, pin)) {
            toast.success("Sale voided");
            setVoidTarget(null);
          } else {
            toast.error("Could not void sale");
          }
        }}
      />
    </div>
  );
}
