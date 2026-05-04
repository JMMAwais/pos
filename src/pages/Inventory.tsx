import { useState } from "react";
import { type Product, usePos } from "../store/pos";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "../components/ui/dialog";
import { Label } from "../components/ui/label";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { formatCurrency } from "../lib/format";
import { toast } from "sonner";

const empty: Omit<Product, "id"> = {
  name: "",
  sku: "",
  category: "Pantry",
  price: 0,
  stock: 0,
  emoji: "📦",
  image: "",
};

export default function Inventory() {
  const { products, addProduct, updateProduct, deleteProduct } = usePos();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(empty);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
  );

  const openAdd = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    const { id, ...rest } = p;
    setForm(rest);
    setOpen(true);
  };

  const save = () => {
    if (!form.name || !form.sku) {
      toast.error("Name and SKU are required");
      return;
    }
    if (editing) {
      updateProduct(editing.id, form);
      toast.success("Product updated");
    } else {
      addProduct(form);
      toast.success("Product added");
    }
    setOpen(false);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">{products.length} products in catalog</p>
        </div>
        <Button onClick={openAdd} className="bg-gradient-primary text-primary-foreground shadow-glow">
          <Plus className="mr-2 h-4 w-4" /> Add product
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => {
              const out = p.stock === 0;
              const low = !out && p.stock <= 8;
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-muted text-lg">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          p.emoji
                        )}
                      </div>
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(p.price)}</TableCell>
                  <TableCell className="text-right">
                    {out ? (
                      <Badge variant="destructive">Out</Badge>
                    ) : low ? (
                      <Badge className="bg-warning text-warning-foreground hover:bg-warning">
                        Low · {p.stock}
                      </Badge>
                    ) : (
                      <span className="font-mono">{p.stock}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        deleteProduct(p.id);
                        toast.success("Product deleted");
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-2xl">
                {form.image ? (
                  <img src={form.image} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  form.emoji || "📦"
                )}
              </div>
              <div className="grid flex-1 grid-cols-[80px_1fr] gap-3">
                <Field label="Emoji">
                  <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} />
                </Field>
                <Field label="Name">
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </Field>
              </div>
            </div>
            <Field label="Image">
              <div className="flex gap-2">
                <Input
                  placeholder="Paste image URL (optional)"
                  value={form.image || ""}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("product-image-upload")?.click()}
                >
                  Upload
                </Button>
                {form.image && (
                  <Button type="button" variant="ghost" onClick={() => setForm({ ...form, image: "" })}>
                    Clear
                  </Button>
                )}
                <input
                  id="product-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setForm((f) => ({ ...f, image: String(reader.result) }));
                    reader.readAsDataURL(file);
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Image overrides the emoji when set.</p>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="SKU">
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              </Field>
              <Field label="Category">
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price ($)">
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Stock">
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                />
              </Field>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>{editing ? "Save changes" : "Add product"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
