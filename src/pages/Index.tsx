import { useMemo, useState } from "react";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { ScrollArea } from "../components/ui/scroll-area";
import { Card } from "../components/ui/card";
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Banknote, X, Tag, Percent, DollarSign, ShieldCheck } from "lucide-react";
import {type Product, TAX, usePos, computeDiscount, useCurrentUser } from "../store/pos";
import { formatCurrency } from "../lib/format";
import { ReceiptDialog } from "../components/ReceiptDialog";
import { AdminPinDialog } from "../components/AdminPinDialog";
import type { Sale } from "../store/pos";
import { toast } from "sonner";

export default function POSPage() {
  const { products, cart, addToCart, updateQty, removeFromCart, clearCart, checkout, discount, setDiscount, clearDiscount } = usePos();
  const me = useCurrentUser();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [open, setOpen] = useState(false);
  const [pendingMethod, setPendingMethod] = useState<"cash" | "card" | null>(null);
  const [needsApproval, setNeedsApproval] = useState(false);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === "All" || p.category === category) &&
          (p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.sku.toLowerCase().includes(query.toLowerCase()))
      ),
    [products, query, category]
  );

  const subtotal = cart.reduce((s, it) => s + it.price * it.quantity, 0);
  const discountAmount = computeDiscount(subtotal, discount);
  const taxable = Math.max(0, subtotal - discountAmount);
  const tax = taxable * TAX;
  const total = taxable + tax;

  const limit = me?.discountLimitPercent ?? 100;
  const effectiveDiscountPercent = subtotal > 0 ? (discountAmount / subtotal) * 100 : 0;
  const exceedsLimit = me?.role !== "admin" && effectiveDiscountPercent > limit + 0.01;

  const doCheckout = (method: "cash" | "card") => {
    const sale = checkout(method);
    if (sale) {
      setLastSale(sale);
      setOpen(true);
      toast.success(`Sale ${formatCurrency(sale.total)} completed`);
    }
  };

  const onCheckout = (method: "cash" | "card") => {
    if (exceedsLimit) {
      setPendingMethod(method);
      setNeedsApproval(true);
      return;
    }
    doCheckout(method);
  };

  const handleAdd = (p: Product) => {
    if (p.stock <= 0) {
      toast.error(`${p.name} is out of stock`);
      return;
    }
    addToCart(p);
  };

  return (
    <div className="grid h-[calc(100vh-3.5rem)] w-full grid-cols-1 lg:grid-cols-[1fr_400px]">
      <div className="flex flex-col overflow-hidden border-r border-border">
        <div className="flex flex-col gap-3 border-b border-border bg-card p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products or scan barcode (SKU)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filtered.length > 0) {
                  e.preventDefault();
                  handleAdd(filtered[0]);
                  setQuery("");
                }
              }}
              className="h-11 pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={category === c ? "default" : "outline"}
                onClick={() => setCategory(c)}
                className="h-8 rounded-full"
              >
                {c}
              </Button>
            ))}
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => {
              const low = p.stock > 0 && p.stock <= 8;
              const out = p.stock === 0;
              return (
                <button
                  key={p.id}
                  disabled={out}
                  onClick={() => handleAdd(p)}
                  className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card p-3 text-left shadow-card transition-base hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <div className="mb-3 flex h-20 items-center justify-center overflow-hidden rounded-lg bg-gradient-subtle text-4xl">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      p.emoji
                    )}
                  </div>
                  <div className="mb-1 flex items-start justify-between gap-1">
                    <span className="line-clamp-2 text-sm font-semibold leading-tight">
                      {p.name}
                    </span>
                  </div>
                  <span className="mb-2 font-mono text-[10px] text-muted-foreground">
                    {p.sku}
                  </span>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="text-base font-bold">{formatCurrency(p.price)}</span>
                    {out ? (
                      <Badge variant="destructive" className="text-[10px]">Out</Badge>
                    ) : low ? (
                      <Badge className="bg-warning text-warning-foreground hover:bg-warning text-[10px]">
                        Low {p.stock}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">{p.stock} in stock</span>
                    )}
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
                No products match your search.
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Cart */}
      <aside className="flex h-full flex-col bg-card">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            <h2 className="text-base font-bold">Current Order</h2>
            <Badge variant="secondary">{cart.length}</Badge>
          </div>
          {cart.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearCart} className="text-muted-foreground">
              <X className="h-4 w-4" /> Clear
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1">
          {cart.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
              <ShoppingCart className="h-10 w-10 opacity-30" />
              <p className="text-sm">Cart is empty.</p>
              <p className="text-xs">Tap a product to add it.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {cart.map((it) => (
                <li key={it.productId} className="flex items-start gap-3 p-4">
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold">{it.name}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {formatCurrency(it.price)} each
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQty(it.productId, it.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-mono font-semibold">
                        {it.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQty(it.productId, it.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-bold">
                      {formatCurrency(it.price * it.quantity)}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(it.productId)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <Card className="m-3 rounded-xl border-border p-4 shadow-none">
          <div className="mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Tag className="h-3.5 w-3.5" /> Discount
              </label>
              {discountAmount > 0 && (
                <button
                  onClick={clearDiscount}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex rounded-md border border-input bg-background p-0.5">
                <button
                  type="button"
                  onClick={() => setDiscount({ ...discount, type: "percent" })}
                  className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
                    discount.type === "percent"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Percent discount"
                >
                  <Percent className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDiscount({ ...discount, type: "fixed" })}
                  className={`flex h-8 w-8 items-center justify-center rounded transition-colors ${
                    discount.type === "fixed"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  aria-label="Fixed discount"
                >
                  <DollarSign className="h-3.5 w-3.5" />
                </button>
              </div>
              <Input
                type="number"
                min={0}
                max={discount.type === "percent" ? 100 : undefined}
                step="0.01"
                value={discount.value || ""}
                onChange={(e) =>
                  setDiscount({ ...discount, value: Math.max(0, Number(e.target.value) || 0) })
                }
                placeholder={discount.type === "percent" ? "0%" : "0.00"}
                className="h-9 flex-1"
              />
            </div>
          </div>
          <div className="space-y-1.5 border-t border-border pt-3 text-sm">
            <Row label="Subtotal" value={formatCurrency(subtotal)} />
            {discountAmount > 0 && (
              <Row
                label={`Discount${discount.type === "percent" ? ` (${discount.value}%)` : ""}`}
                value={`−${formatCurrency(discountAmount)}`}
              />
            )}
            <Row label="Tax (8%)" value={formatCurrency(tax)} />
            <div className="flex items-center justify-between pt-2 text-lg font-bold">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(total)}</span>
            </div>
          </div>
          {exceedsLimit && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 p-2 text-xs">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-warning" />
              <span>Discount {effectiveDiscountPercent.toFixed(1)}% exceeds your limit ({limit}%). Admin PIN required.</span>
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="h-12"
              disabled={cart.length === 0}
              onClick={() => onCheckout("cash")}
            >
              <Banknote className="mr-2 h-4 w-4" /> Cash
            </Button>
            <Button
              className="h-12 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-95"
              disabled={cart.length === 0}
              onClick={() => onCheckout("card")}
            >
              <CreditCard className="mr-2 h-4 w-4" /> Card
            </Button>
          </div>
        </Card>
      </aside>

      <ReceiptDialog sale={lastSale} open={open} onOpenChange={setOpen} />
      <AdminPinDialog
        open={needsApproval}
        onOpenChange={(o) => { setNeedsApproval(o); if (!o) setPendingMethod(null); }}
        title="Approve large discount"
        description={`Cashier discount limit is ${limit}%. Admin must approve ${effectiveDiscountPercent.toFixed(1)}% off.`}
        onApproved={() => {
          if (pendingMethod) doCheckout(pendingMethod);
          setPendingMethod(null);
        }}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-mono text-foreground">{value}</span>
    </div>
  );
}
