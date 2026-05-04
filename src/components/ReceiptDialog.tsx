import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import {type Sale } from "../store/pos";
import { formatCurrency, formatDate } from "../lib/format";
import { CheckCircle2, Printer } from "lucide-react";

export function ReceiptDialog({
  sale,
  open,
  onOpenChange,
}: {
  sale: Sale | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  if (!sale) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Sale completed
          </DialogTitle>
        </DialogHeader>
        <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 font-mono text-xs">
          <div className="text-center">
            <div className="text-sm font-bold">NORTHWIND POS</div>
            <div className="text-muted-foreground">123 Market St · Receipt</div>
            <div className="mt-1 text-muted-foreground">{formatDate(sale.createdAt)}</div>
            <div className="text-muted-foreground">#{sale.id.slice(-8).toUpperCase()}</div>
          </div>
          <div className="my-3 border-t border-dashed border-border" />
          <div className="space-y-1.5">
            {sale.items.map((it) => (
              <div key={it.productId} className="flex justify-between gap-2">
                <span className="truncate">
                  {it.quantity}× {it.name}
                </span>
                <span>{formatCurrency(it.price * it.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="my-3 border-t border-dashed border-border" />
          <div className="space-y-1">
            <Row label="Subtotal" value={formatCurrency(sale.subtotal)} />
            <Row label="Tax (8%)" value={formatCurrency(sale.tax)} />
            <div className="flex justify-between pt-1 text-sm font-bold">
              <span>TOTAL</span>
              <span>{formatCurrency(sale.total)}</span>
            </div>
            <Row label="Paid" value={sale.paymentMethod.toUpperCase()} />
          </div>
          <div className="mt-3 text-center text-muted-foreground">Thank you!</div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button className="flex-1" onClick={() => onOpenChange(false)}>
            New sale
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
