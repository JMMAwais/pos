import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Product = {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  emoji: string;
  image?: string;
};

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

export type Discount = {
  type: "percent" | "fixed";
  value: number;
};

export type Role = "admin" | "cashier";

export type StaffUser = {
  id: string;
  name: string;
  pin: string; // 4-6 digits — used by cashiers to sign in, and by admins as a quick override PIN
  role: Role;
  /** Admin-only: username for username+password login */
  username?: string;
  /** Admin-only: password for username+password login */
  password?: string;
  discountLimitPercent: number; // max % discount cashier can apply without admin approval
  active: boolean;
};

export type Counter = {
  id: string;
  name: string;
  active: boolean;
};

export type Session = {
  userId: string;
  counterId: string;
  startedAt: string;
} | null;

export type Sale = {
  id: string;
  createdAt: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountInfo?: Discount;
  tax: number;
  total: number;
  paymentMethod: "cash" | "card";
  cashier: string; // user name (snapshot)
  cashierId?: string;
  counterId?: string;
  counterName?: string;
  voided?: boolean;
  voidedAt?: string;
  voidedBy?: string;
};

const TAX_RATE = 0.08;

const seedProducts: Product[] = [
  { id: "p1", name: "Espresso Beans 250g", sku: "BEV-001", category: "Beverages", price: 14.5, stock: 42, emoji: "☕" },
  { id: "p2", name: "Matcha Powder", sku: "BEV-002", category: "Beverages", price: 22.0, stock: 18, emoji: "🍵" },
  { id: "p3", name: "Sparkling Water 12pk", sku: "BEV-003", category: "Beverages", price: 9.99, stock: 64, emoji: "🥤" },
  { id: "p4", name: "Sourdough Loaf", sku: "BAK-001", category: "Bakery", price: 7.5, stock: 12, emoji: "🍞" },
  { id: "p5", name: "Croissant", sku: "BAK-002", category: "Bakery", price: 3.75, stock: 28, emoji: "🥐" },
  { id: "p6", name: "Blueberry Muffin", sku: "BAK-003", category: "Bakery", price: 3.25, stock: 5, emoji: "🧁" },
  { id: "p7", name: "Avocado", sku: "PRD-001", category: "Produce", price: 1.99, stock: 87, emoji: "🥑" },
  { id: "p8", name: "Organic Apples 1kg", sku: "PRD-002", category: "Produce", price: 4.5, stock: 45, emoji: "🍎" },
  { id: "p9", name: "Bananas 1kg", sku: "PRD-003", category: "Produce", price: 2.25, stock: 53, emoji: "🍌" },
  { id: "p10", name: "Dark Chocolate Bar", sku: "SNK-001", category: "Snacks", price: 4.95, stock: 33, emoji: "🍫" },
  { id: "p11", name: "Sea Salt Chips", sku: "SNK-002", category: "Snacks", price: 3.5, stock: 24, emoji: "🥔" },
  { id: "p12", name: "Mixed Nuts 200g", sku: "SNK-003", category: "Snacks", price: 8.99, stock: 19, emoji: "🥜" },
  { id: "p13", name: "Greek Yogurt", sku: "DRY-001", category: "Dairy", price: 5.25, stock: 22, emoji: "🥛" },
  { id: "p14", name: "Cheddar Block", sku: "DRY-002", category: "Dairy", price: 11.0, stock: 14, emoji: "🧀" },
  { id: "p15", name: "Free Range Eggs", sku: "DRY-003", category: "Dairy", price: 6.5, stock: 38, emoji: "🥚" },
  { id: "p16", name: "Olive Oil 500ml", sku: "PNT-001", category: "Pantry", price: 16.0, stock: 9, emoji: "🫒" },
];

// Seed sales across last 7 days
const now = Date.now();
const seedSales: Sale[] = Array.from({ length: 24 }).map((_, i) => {
  const items: CartItem[] = [];
  const count = 1 + Math.floor(Math.random() * 4);
  for (let k = 0; k < count; k++) {
    const p = seedProducts[Math.floor(Math.random() * seedProducts.length)];
    items.push({ productId: p.id, name: p.name, price: p.price, quantity: 1 + Math.floor(Math.random() * 3) });
  }
  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const tax = +(subtotal * TAX_RATE).toFixed(2);
  return {
    id: `seed-${i}`,
    createdAt: new Date(now - Math.floor(Math.random() * 7) * 86400000 - Math.floor(Math.random() * 86400000)).toISOString(),
    items,
    subtotal: +subtotal.toFixed(2),
    discount: 0,
    tax,
    total: +(subtotal + tax).toFixed(2),
    paymentMethod: Math.random() > 0.4 ? "card" : "cash",
    cashier: ["Alex", "Jordan", "Sam"][i % 3],
  };
});

const seedUsers: StaffUser[] = [
  { id: "u-admin", name: "Owner", pin: "1234", username: "admin", password: "admin123", role: "admin", discountLimitPercent: 100, active: true },
  { id: "u-alex", name: "Alex", pin: "1111", role: "cashier", discountLimitPercent: 10, active: true },
  { id: "u-jordan", name: "Jordan", pin: "2222", role: "cashier", discountLimitPercent: 10, active: true },
];

const seedCounters: Counter[] = [
  { id: "c1", name: "Counter #01", active: true },
  { id: "c2", name: "Counter #02", active: true },
];

type State = {
  products: Product[];
  cart: CartItem[];
  sales: Sale[];
  discount: Discount;
  users: StaffUser[];
  counters: Counter[];
  session: Session;
  // session
  login: (userId: string, pin: string, counterId: string) => boolean;
  loginAdmin: (username: string, password: string, counterId: string) => boolean;
  logout: () => void;
  // discount/cart
  setDiscount: (d: Discount) => void;
  clearDiscount: () => void;
  addToCart: (p: Product) => void;
  updateQty: (id: string, q: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  checkout: (paymentMethod: "cash" | "card") => Sale | null;
  voidSale: (saleId: string, adminPin: string) => boolean;
  // products
  addProduct: (p: Omit<Product, "id">) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  // users
  addUser: (u: Omit<StaffUser, "id">) => void;
  updateUser: (id: string, patch: Partial<StaffUser>) => void;
  deleteUser: (id: string) => void;
  // counters
  addCounter: (c: Omit<Counter, "id">) => void;
  updateCounter: (id: string, patch: Partial<Counter>) => void;
  deleteCounter: (id: string) => void;
  // helpers
  verifyAdminPin: (pin: string) => boolean;
};

export const computeDiscount = (subtotal: number, d: Discount) => {
  if (!d || !d.value || d.value <= 0) return 0;
  const raw = d.type === "percent" ? subtotal * (d.value / 100) : d.value;
  return Math.max(0, Math.min(subtotal, +raw.toFixed(2)));
};

export const TAX = TAX_RATE;

export const usePos = create<State>()(
  persist(
    (set, get) => ({
      products: seedProducts,
      cart: [],
      sales: seedSales,
      discount: { type: "percent", value: 0 },
      users: seedUsers,
      counters: seedCounters,
      session: null,
      login: (userId, pin, counterId) => {
        const u = get().users.find((x) => x.id === userId && x.active);
        const c = get().counters.find((x) => x.id === counterId && x.active);
        if (!u || !c || u.pin !== pin) return false;
        set({ session: { userId, counterId, startedAt: new Date().toISOString() }, cart: [], discount: { type: "percent", value: 0 } });
        return true;
      },
      loginAdmin: (username, password, counterId) => {
        const uname = username.trim().toLowerCase();
        const u = get().users.find(
          (x) => x.active && x.role === "admin" && (x.username ?? "").trim().toLowerCase() === uname && x.password === password
        );
        const c = get().counters.find((x) => x.id === counterId && x.active);
        if (!u || !c) return false;
        set({ session: { userId: u.id, counterId, startedAt: new Date().toISOString() }, cart: [], discount: { type: "percent", value: 0 } });
        return true;
      },
      logout: () => set({ session: null, cart: [], discount: { type: "percent", value: 0 } }),
      verifyAdminPin: (pin) =>
        get().users.some((u) => u.role === "admin" && u.active && (u.pin === pin || u.password === pin)),
      setDiscount: (d) => set({ discount: d }),
      clearDiscount: () => set({ discount: { type: "percent", value: 0 } }),
      addToCart: (p) => {
        const existing = get().cart.find((c) => c.productId === p.id);
        if (existing) {
          set({
            cart: get().cart.map((c) =>
              c.productId === p.id ? { ...c, quantity: c.quantity + 1 } : c
            ),
          });
        } else {
          set({
            cart: [...get().cart, { productId: p.id, name: p.name, price: p.price, quantity: 1 }],
          });
        }
      },
      updateQty: (id, q) => {
        if (q <= 0) {
          set({ cart: get().cart.filter((c) => c.productId !== id) });
          return;
        }
        set({
          cart: get().cart.map((c) => (c.productId === id ? { ...c, quantity: q } : c)),
        });
      },
      removeFromCart: (id) =>
        set({ cart: get().cart.filter((c) => c.productId !== id) }),
      clearCart: () => set({ cart: [] }),
      checkout: (paymentMethod) => {
        const cart = get().cart;
        if (cart.length === 0) return null;
        const session = get().session;
        const user = session ? get().users.find((u) => u.id === session.userId) : null;
        const counter = session ? get().counters.find((c) => c.id === session.counterId) : null;
        const discountInfo = get().discount;
        const subtotal = cart.reduce((s, it) => s + it.price * it.quantity, 0);
        const discount = computeDiscount(subtotal, discountInfo);
        const taxable = Math.max(0, subtotal - discount);
        const tax = +(taxable * TAX_RATE).toFixed(2);
        const sale: Sale = {
          id: `s-${Date.now()}`,
          createdAt: new Date().toISOString(),
          items: cart,
          subtotal: +subtotal.toFixed(2),
          discount: +discount.toFixed(2),
          discountInfo: discount > 0 ? discountInfo : undefined,
          tax,
          total: +(taxable + tax).toFixed(2),
          paymentMethod,
          cashier: user?.name ?? "Unknown",
          cashierId: user?.id,
          counterId: counter?.id,
          counterName: counter?.name,
        };
        const products = get().products.map((p) => {
          const inCart = cart.find((c) => c.productId === p.id);
          return inCart ? { ...p, stock: Math.max(0, p.stock - inCart.quantity) } : p;
        });
        set({ sales: [sale, ...get().sales], cart: [], products, discount: { type: "percent", value: 0 } });
        return sale;
      },
      voidSale: (saleId, adminPin) => {
        if (!get().verifyAdminPin(adminPin)) return false;
        const admin = get().users.find((u) => u.role === "admin" && u.active && (u.pin === adminPin || u.password === adminPin));
        const sale = get().sales.find((s) => s.id === saleId);
        if (!sale || sale.voided) return false;
        const products = get().products.map((p) => {
          const it = sale.items.find((i) => i.productId === p.id);
          return it ? { ...p, stock: p.stock + it.quantity } : p;
        });
        const sales = get().sales.map((s) =>
          s.id === saleId
            ? { ...s, voided: true, voidedAt: new Date().toISOString(), voidedBy: admin?.name }
            : s
        );
        set({ sales, products });
        return true;
      },
      addProduct: (p) =>
        set({ products: [{ ...p, id: `p-${Date.now()}` }, ...get().products] }),
      updateProduct: (id, patch) =>
        set({
          products: get().products.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }),
      deleteProduct: (id) =>
        set({ products: get().products.filter((p) => p.id !== id) }),
      addUser: (u) =>
        set({ users: [...get().users, { ...u, id: `u-${Date.now()}` }] }),
      updateUser: (id, patch) =>
        set({ users: get().users.map((u) => (u.id === id ? { ...u, ...patch } : u)) }),
      deleteUser: (id) =>
        set({ users: get().users.filter((u) => u.id !== id) }),
      addCounter: (c) =>
        set({ counters: [...get().counters, { ...c, id: `c-${Date.now()}` }] }),
      updateCounter: (id, patch) =>
        set({ counters: get().counters.map((c) => (c.id === id ? { ...c, ...patch } : c)) }),
      deleteCounter: (id) =>
        set({ counters: get().counters.filter((c) => c.id !== id) }),
    }),
    { name: "pos-store-v2" }
  )
);

// Helpers
export const useCurrentUser = () => {
  const session = usePos((s) => s.session);
  const users = usePos((s) => s.users);
  return session ? users.find((u) => u.id === session.userId) ?? null : null;
};

export const useCurrentCounter = () => {
  const session = usePos((s) => s.session);
  const counters = usePos((s) => s.counters);
  return session ? counters.find((c) => c.id === session.counterId) ?? null : null;
};
