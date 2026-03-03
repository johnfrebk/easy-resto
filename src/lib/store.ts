// Store: persistencia con localStorage para el sistema POS

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: 'open' | 'closed';
  createdAt: string;
  closedAt?: string;
  subtotal: number;
  tax: number;
  total: number;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  type: 'entrada' | 'salida' | 'venta';
  quantity: number;
  date: string;
}

export interface DailySale {
  date: string;
  total: number;
  orders: number;
}

const TAX_RATE = 0.16; // 16% IVA

function load<T>(key: string, fallback: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch { return fallback; }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Products
export function getProducts(): Product[] {
  return load<Product[]>('pos_products', defaultProducts());
}

export function saveProducts(products: Product[]) {
  save('pos_products', products);
}

export function addProduct(p: Omit<Product, 'id'>) {
  const products = getProducts();
  products.push({ ...p, id: crypto.randomUUID() });
  saveProducts(products);
}

export function updateProduct(id: string, updates: Partial<Product>) {
  const products = getProducts().map(p => p.id === id ? { ...p, ...updates } : p);
  saveProducts(products);
}

export function deleteProduct(id: string) {
  saveProducts(getProducts().filter(p => p.id !== id));
}

// Orders
export function getOrders(): Order[] {
  return load<Order[]>('pos_orders', []);
}

export function saveOrders(orders: Order[]) {
  save('pos_orders', orders);
}

export function createOrder(tableNumber: number): Order {
  const order: Order = {
    id: crypto.randomUUID(),
    tableNumber,
    items: [],
    status: 'open',
    createdAt: new Date().toISOString(),
    subtotal: 0, tax: 0, total: 0,
  };
  const orders = getOrders();
  orders.push(order);
  saveOrders(orders);
  return order;
}

export function addItemToOrder(orderId: string, product: Product, qty: number = 1) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order || order.status === 'closed') return;

  const existing = order.items.find(i => i.productId === product.id);
  if (existing) {
    existing.quantity += qty;
  } else {
    order.items.push({ productId: product.id, name: product.name, price: product.price, quantity: qty });
  }
  recalcOrder(order);
  saveOrders(orders);
}

export function removeItemFromOrder(orderId: string, productId: string) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  order.items = order.items.filter(i => i.productId !== productId);
  recalcOrder(order);
  saveOrders(orders);
}

export function updateItemQty(orderId: string, productId: string, qty: number) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order) return;
  const item = order.items.find(i => i.productId === productId);
  if (item) {
    item.quantity = Math.max(1, qty);
    recalcOrder(order);
    saveOrders(orders);
  }
}

export function closeOrder(orderId: string) {
  const orders = getOrders();
  const order = orders.find(o => o.id === orderId);
  if (!order || order.status === 'closed') return;

  order.status = 'closed';
  order.closedAt = new Date().toISOString();

  // Descontar inventario
  const products = getProducts();
  const logs: InventoryLog[] = getInventoryLogs();
  for (const item of order.items) {
    const prod = products.find(p => p.id === item.productId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - item.quantity);
      logs.push({
        id: crypto.randomUUID(),
        productId: prod.id,
        productName: prod.name,
        type: 'venta',
        quantity: item.quantity,
        date: new Date().toISOString(),
      });
    }
  }
  saveProducts(products);
  saveInventoryLogs(logs);
  saveOrders(orders);
}

function recalcOrder(order: Order) {
  order.subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
  order.tax = order.subtotal * TAX_RATE;
  order.total = order.subtotal + order.tax;
}

// Inventory logs
export function getInventoryLogs(): InventoryLog[] {
  return load<InventoryLog[]>('pos_inv_logs', []);
}

export function saveInventoryLogs(logs: InventoryLog[]) {
  save('pos_inv_logs', logs);
}

export function addInventoryEntry(productId: string, type: 'entrada' | 'salida', quantity: number) {
  const products = getProducts();
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  if (type === 'entrada') prod.stock += quantity;
  else prod.stock = Math.max(0, prod.stock - quantity);

  saveProducts(products);

  const logs = getInventoryLogs();
  logs.push({
    id: crypto.randomUUID(),
    productId: prod.id,
    productName: prod.name,
    type,
    quantity,
    date: new Date().toISOString(),
  });
  saveInventoryLogs(logs);
}

// Reports
export function getTodaySales(): { total: number; count: number; items: { name: string; qty: number; revenue: number }[] } {
  const today = new Date().toDateString();
  const orders = getOrders().filter(o => o.status === 'closed' && new Date(o.closedAt!).toDateString() === today);
  const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of orders) {
    for (const i of o.items) {
      const e = itemMap.get(i.productId) || { name: i.name, qty: 0, revenue: 0 };
      e.qty += i.quantity;
      e.revenue += i.price * i.quantity;
      itemMap.set(i.productId, e);
    }
  }
  return {
    total: orders.reduce((s, o) => s + o.total, 0),
    count: orders.length,
    items: Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty),
  };
}

export function getLowStockProducts(): Product[] {
  return getProducts().filter(p => p.stock <= p.minStock);
}

// Default products
function defaultProducts(): Product[] {
  return [
    { id: crypto.randomUUID(), name: 'Hamburguesa Clásica', category: 'Comida', price: 120, cost: 45, stock: 50, minStock: 10 },
    { id: crypto.randomUUID(), name: 'Tacos (3 pzas)', category: 'Comida', price: 85, cost: 30, stock: 80, minStock: 15 },
    { id: crypto.randomUUID(), name: 'Ensalada César', category: 'Comida', price: 95, cost: 35, stock: 30, minStock: 5 },
    { id: crypto.randomUUID(), name: 'Pizza Personal', category: 'Comida', price: 150, cost: 55, stock: 25, minStock: 5 },
    { id: crypto.randomUUID(), name: 'Refresco', category: 'Bebidas', price: 35, cost: 10, stock: 100, minStock: 20 },
    { id: crypto.randomUUID(), name: 'Agua Mineral', category: 'Bebidas', price: 25, cost: 8, stock: 100, minStock: 20 },
    { id: crypto.randomUUID(), name: 'Café Americano', category: 'Bebidas', price: 40, cost: 12, stock: 60, minStock: 10 },
    { id: crypto.randomUUID(), name: 'Jugo Natural', category: 'Bebidas', price: 50, cost: 18, stock: 40, minStock: 8 },
    { id: crypto.randomUUID(), name: 'Pastel de Chocolate', category: 'Postres', price: 75, cost: 25, stock: 20, minStock: 5 },
    { id: crypto.randomUUID(), name: 'Flan Napolitano', category: 'Postres', price: 55, cost: 18, stock: 15, minStock: 5 },
  ];
}

export const CATEGORIES = ['Comida', 'Bebidas', 'Postres', 'Extras'];
export const TABLE_COUNT = 12;
