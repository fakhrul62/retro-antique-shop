export const seedOrders = [
  { id: "OS-10482", date: "2026-06-21T09:42:00.000Z", customer: { name: "Eleanor Walsh", email: "eleanor@example.com", phone: "+1 212 555 0184", address: "18 Grove Street", city: "New York", country: "United States" }, items: [{ id: "pocket-watch", name: "Engraved Hunter Watch", quantity: 1, price: 860, image: "/images/pocket-watch.png" }], subtotal: 860, shipping: 0, total: 860, status: "Packed", payment: { method: "Visa ···· 1842", status: "Paid", transaction: "pi_3OS10482" }, tracking: { carrier: "FedEx", number: "784523190142", eta: "2026-06-24", step: 2 } },
  { id: "OS-10481", date: "2026-06-20T16:18:00.000Z", customer: { name: "Marcus Chen", email: "marcus@example.com", phone: "+1 415 555 0131", address: "442 Pine Street", city: "San Francisco", country: "United States" }, items: [{ id: "gramophone", name: "Victor Horn Gramophone", quantity: 1, price: 1280, image: "/images/gramophone.png" }], subtotal: 1280, shipping: 0, total: 1280, status: "In transit", payment: { method: "Mastercard ···· 8041", status: "Paid", transaction: "pi_3OS10481" }, tracking: { carrier: "DHL Express", number: "JD0146009271", eta: "2026-06-23", step: 3 } },
  { id: "OS-10480", date: "2026-06-19T11:04:00.000Z", customer: { name: "Amelia Hart", email: "amelia@example.com", phone: "+44 7700 900210", address: "7 Kensington Park", city: "London", country: "United Kingdom" }, items: [{ id: "porcelain-vase", name: "Cobalt Porcelain Vase", quantity: 1, price: 640, image: "/images/porcelain-vase.png" }], subtotal: 640, shipping: 45, total: 685, status: "Delivered", payment: { method: "Amex ···· 2017", status: "Paid", transaction: "pi_3OS10480" }, tracking: { carrier: "UPS", number: "1Z84A20E039204", eta: "2026-06-20", step: 4 } },
  { id: "OS-10479", date: "2026-06-18T14:31:00.000Z", customer: { name: "Noah Bennett", email: "noah@example.com", phone: "+1 617 555 0199", address: "81 Beacon Hill", city: "Boston", country: "United States" }, items: [{ id: "mantel-clock", name: "French Marble Mantel Clock", quantity: 1, price: 2150, image: "/images/hero-collection.png" }], subtotal: 2150, shipping: 0, total: 2150, status: "Awaiting payment", payment: { method: "Bank transfer", status: "Pending", transaction: "Pending" }, tracking: { carrier: "Unassigned", number: "—", eta: "—", step: 0 } },
];

export const seedNotifications = [
  { id: 1, type: "inventory", title: "Low stock requires attention", detail: "Engraved Hunter Watch is the last available piece.", time: "12 min ago", read: false },
  { id: 2, type: "order", title: "New high-value order", detail: "Order OS-10482 was paid and is ready to pack.", time: "38 min ago", read: false },
  { id: 3, type: "payment", title: "Payment still pending", detail: "OS-10479 has been awaiting bank transfer for 3 days.", time: "2 hr ago", read: false },
  { id: 4, type: "review", title: "New five-star review", detail: "Amelia reviewed the Cobalt Porcelain Vase.", time: "Yesterday", read: true },
];

export const seedReviews = [
  { id: 1, productId: "porcelain-vase", customer: "Amelia Hart", rating: 5, date: "2026-06-21", status: "Published", text: "Exactly as documented. The condition report and packing were exceptional." },
  { id: 2, productId: "pocket-watch", customer: "James Porter", rating: 5, date: "2026-06-17", status: "Published", text: "A serious collector’s listing with the history and service details I needed." },
  { id: 3, productId: "gramophone", customer: "Sofia Lind", rating: 4, date: "2026-06-13", status: "Pending", text: "Beautiful piece and careful delivery. The sound is warmer than expected." },
];

export const seedUsers = [
  {
    id: "admin-fakhrul", name: "Fakhrul M.", email: "admin@oldsoul.com", password: "admin123",
    role: "admin", joined: "2026-01-01",
  },
  {
    id: "customer-eleanor", name: "Eleanor Walsh", email: "eleanor@example.com", password: "collector",
    role: "customer",
    phone: "+1 212 555 0184", address: "18 Grove Street", city: "New York", region: "NY",
    postalCode: "10014", country: "United States", joined: "2025-09-14",
    preferences: "Clocks, silver, and mechanical objects",
  },
];
