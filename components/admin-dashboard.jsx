"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCommerce } from "./commerce";

const money = (value) => `$${Number(value || 0).toLocaleString()}`;
const fmtDate = (value) => new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const nav = [
  ["overview", "Overview", "⌂"], ["inventory", "Inventory", "◇"], ["orders", "Orders", "▤"],
  ["customers", "Customers", "♙"], ["payments", "Payments", "$"], ["delivery", "Delivery", "↗"],
  ["reviews", "Reviews", "★"], ["notifications", "Notifications", "•"],
];

export function AdminDashboard() {
  const store = useCommerce();
  const [section, setSection] = useState("overview");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [toast, setToast] = useState("");
  const unread = store.notifications.filter((item) => !item.read).length;

  function flash(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2200);
  }

  function go(next) {
    setSection(next);
    setSelectedProduct(null);
    setSelectedOrder(null);
  }

  return <main className="admin-app">
    <aside className="admin-sidebar">
      <Link href="/" className="admin-brand"><span>OS</span><b>Old Soul<small>Mercantile Admin</small></b></Link>
      <nav>{nav.map(([id, label, icon]) => <button key={id} className={section === id ? "active" : ""} onClick={() => go(id)}><i>{icon}</i>{label}{id === "notifications" && unread > 0 && <em>{unread}</em>}</button>)}</nav>
      <div className="admin-user"><span>FM</span><div><b>Fakhrul M.</b><small>Administrator</small></div><button title="Sign out">↗</button></div>
    </aside>
    <section className="admin-workspace">
      <header className="admin-topbar">
        <div><p>Old Soul Mercantile</p><b>{nav.find(([id]) => id === section)?.[1]}</b></div>
        <label className="admin-search">⌕<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search products, orders, customers…" /></label>
        <button className="admin-alert" onClick={() => go("notifications")}>♢{unread > 0 && <span>{unread}</span>}</button>
        <Link href="/" className="admin-store-link">View store ↗</Link>
      </header>
      <div className="admin-content">
        {section === "overview" && <Overview {...store} go={go} setSelectedOrder={setSelectedOrder} />}
        {section === "inventory" && !selectedProduct && <Inventory catalog={store.catalog} search={search} category={category} setCategory={setCategory} select={setSelectedProduct} add={() => setAddOpen(true)} />}
        {section === "inventory" && selectedProduct && <ProductRecord product={store.catalog.find((item) => item.id === selectedProduct)} back={() => setSelectedProduct(null)} edit={() => setAddOpen(store.catalog.find((item) => item.id === selectedProduct))} />}
        {section === "orders" && !selectedOrder && <Orders orders={store.orders} search={search} select={setSelectedOrder} />}
        {section === "orders" && selectedOrder && <OrderRecord order={store.orders.find((item) => item.id === selectedOrder)} update={store.updateOrder} back={() => setSelectedOrder(null)} flash={flash} />}
        {section === "customers" && <Customers orders={store.orders} search={search} />}
        {section === "payments" && <Payments orders={store.orders} update={store.updateOrder} flash={flash} />}
        {section === "delivery" && <Delivery orders={store.orders} update={store.updateOrder} flash={flash} />}
        {section === "reviews" && <Reviews reviews={store.reviews} catalog={store.catalog} update={store.updateReview} flash={flash} />}
        {section === "notifications" && <Notifications items={store.notifications} mark={store.markNotification} />}
      </div>
    </section>
    {addOpen && <ProductForm existing={typeof addOpen === "object" ? addOpen : null} close={() => setAddOpen(false)} save={(product) => { store.saveProduct(product); setAddOpen(false); setSelectedProduct(product.id); flash(existingMessage(product)); }} />}
    {toast && <div className="admin-toast">✓ {toast}</div>}
  </main>;
}

function existingMessage(product) { return `${product.name} saved`; }

function SectionHead({ eyebrow, title, copy, action }) {
  return <header className="dash-head"><div><p>{eyebrow}</p><h1>{title}</h1>{copy && <span>{copy}</span>}</div>{action}</header>;
}

function Overview({ catalog, orders, notifications, go, setSelectedOrder }) {
  const paid = orders.filter((order) => order.payment?.status === "Paid");
  const revenue = paid.reduce((sum, order) => sum + order.total, 0);
  const inventoryValue = catalog.reduce((sum, item) => sum + item.cost * item.stock, 0);
  const profit = paid.reduce((sum, order) => sum + order.items.reduce((line, item) => line + (item.price - (catalog.find((p) => p.id === item.id)?.cost || 0)) * item.quantity, 0), 0);
  const bars = [38, 55, 43, 67, 59, 82, 74, 95, 70, 88, 76, 100];
  return <>
    <SectionHead eyebrow="Sunday, June 21" title="Good evening, Fakhrul." copy="Here is what is happening across the collection today." action={<button className="primary-admin" onClick={() => go("inventory")}>+ Add antique</button>} />
    <div className="metric-grid">
      <Metric label="Gross sales" value={money(revenue)} change="+18.2%" note="vs previous period" />
      <Metric label="Net profit" value={money(profit)} change="+12.4%" note={`${revenue ? Math.round(profit / revenue * 100) : 0}% margin`} />
      <Metric label="Orders" value={orders.length} change="+3 today" note={`${orders.filter((o) => o.status !== "Delivered").length} need action`} />
      <Metric label="Inventory at cost" value={money(inventoryValue)} change={`${catalog.reduce((s, p) => s + p.stock, 0)} pieces`} note={`${catalog.filter((p) => p.stock <= 1).length} low or sold`} />
    </div>
    <div className="overview-grid">
      <section className="dash-card sales-card"><CardTitle title="Sales performance" meta="Last 12 months" /><div className="sales-total"><b>{money(revenue)}</b><span>Paid revenue</span></div><div className="bar-chart">{bars.map((height, index) => <div key={index}><i style={{ height: `${height}%` }} /><small>{["J","F","M","A","M","J","J","A","S","O","N","D"][index]}</small></div>)}</div></section>
      <section className="dash-card"><CardTitle title="Inventory health" action="Manage" onClick={() => go("inventory")} /><div className="health-ring"><div><b>{catalog.filter((p) => p.stock > 1).length}</b><span>healthy listings</span></div></div><div className="health-legend"><span><i className="healthy" />In stock <b>{catalog.filter((p) => p.stock > 1).length}</b></span><span><i className="low" />Low stock <b>{catalog.filter((p) => p.stock === 1).length}</b></span><span><i className="sold" />Sold out <b>{catalog.filter((p) => p.stock === 0).length}</b></span></div></section>
    </div>
    <div className="overview-grid lower">
      <section className="dash-card"><CardTitle title="Recent orders" action="View all" onClick={() => go("orders")} /><div className="compact-list">{orders.slice(0, 4).map((order) => <button key={order.id} onClick={() => { go("orders"); setSelectedOrder(order.id); }}><span className="order-avatar">{order.customer.name.split(" ").map((n) => n[0]).join("")}</span><span><b>{order.customer.name}</b><small>{order.id} · {fmtDate(order.date)}</small></span><Status value={order.status} /><strong>{money(order.total)}</strong></button>)}</div></section>
      <section className="dash-card"><CardTitle title="Attention needed" action="All alerts" onClick={() => go("notifications")} /><div className="notice-list">{notifications.filter((n) => !n.read).slice(0, 4).map((item) => <div key={item.id}><i>{item.type === "inventory" ? "!" : item.type === "payment" ? "$" : "↗"}</i><span><b>{item.title}</b><small>{item.detail}</small></span><time>{item.time}</time></div>)}</div></section>
    </div>
  </>;
}

function Metric({ label, value, change, note }) { return <article className="metric"><span>{label}</span><b>{value}</b><div><em>{change}</em><small>{note}</small></div></article>; }
function CardTitle({ title, meta, action, onClick }) { return <header className="card-title"><h2>{title}</h2>{meta && <span>{meta}</span>}{action && <button onClick={onClick}>{action} →</button>}</header>; }
function Status({ value }) { return <span className={`dash-status ${String(value).toLowerCase().replaceAll(" ", "-")}`}>{value}</span>; }

function Inventory({ catalog, search, category, setCategory, select, add }) {
  const categories = ["All", ...new Set(catalog.map((item) => item.category))];
  const filtered = catalog.filter((item) => (category === "All" || item.category === category) && `${item.name} ${item.sku} ${item.brand}`.toLowerCase().includes(search.toLowerCase()));
  return <>
    <SectionHead eyebrow={`${catalog.length} catalog records`} title="Antique inventory" copy="Acquisition, provenance, grading, valuation, and stock in one ledger." action={<button className="primary-admin" onClick={add}>+ Add product</button>} />
    <div className="inventory-summary"><span><b>{catalog.reduce((s, p) => s + p.stock, 0)}</b>Units available</span><span><b>{money(catalog.reduce((s, p) => s + p.cost * p.stock, 0))}</b>Capital held</span><span><b>{money(catalog.reduce((s, p) => s + p.price * p.stock, 0))}</b>Retail value</span><span><b>{catalog.filter((p) => p.stock <= 1).length}</b>Need attention</span></div>
    <div className="table-tools"><div className="chip-row">{categories.map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div><span>{filtered.length} records</span></div>
    <div className="data-table inventory-table"><div className="table-row table-head"><span>Object</span><span>Category / maker</span><span>Acquired</span><span>Cost / price</span><span>Stock</span><span>Status</span><span /></div>{filtered.map((product) => <button className="table-row" key={product.id} onClick={() => select(product.id)}><span className="object-cell"><img src={product.image} alt="" /><i><b>{product.name}</b><small>{product.sku} · {product.era}</small></i></span><span><b>{product.category}</b><small>{product.brand}</small></span><span><b>{fmtDate(product.acquired)}</b><small>{product.source}</small></span><span><b>{money(product.cost)} → {money(product.price)}</b><small>{Math.round((product.price - product.cost) / product.price * 100)}% margin</small></span><span><b>{product.stock}</b><small>{product.location}</small></span><Status value={product.status} /><span className="row-arrow">→</span></button>)}</div>
  </>;
}

function ProductRecord({ product, back, edit }) {
  if (!product) return null;
  const profit = product.price - product.cost;
  return <><button className="back-button" onClick={back}>← Back to inventory</button>
    <div className="record-hero"><img src={product.image} alt={product.name} /><div><p>{product.sku} · {product.category}</p><h1>{product.name}</h1><span>{product.era} · {product.origin}</span><div><Status value={product.status} /><Status value={`Grade ${product.grade}`} /></div></div><button className="secondary-admin" onClick={edit}>Edit record</button></div>
    <div className="record-metrics"><Metric label="Acquisition cost" value={money(product.cost)} change={fmtDate(product.acquired)} note="date acquired" /><Metric label="Asking price" value={money(product.price)} change={money(profit)} note="projected gross profit" /><Metric label="Stock" value={product.stock} change={product.location} note="storage location" /><Metric label="Buyer interest" value={product.views} change={`${product.favorites} saved`} note={`${product.reviewCount} reviews`} /></div>
    <div className="record-grid">
      <section className="dash-card record-card"><CardTitle title="Identity & attribution" /><Details rows={[["Maker / workshop", product.maker],["Brand", product.brand],["Production date", product.era],["Country of origin", product.origin],["Materials", product.materials],["Dimensions", product.dimensions],["Weight", product.weight]]} /></section>
      <section className="dash-card record-card"><CardTitle title="Condition & grading" /><div className="grade-display"><b>{product.grade}</b><span><strong>{product.condition}</strong>Last graded {fmtDate(product.lastGraded)}</span></div><p>{product.conditionNotes}</p><Details rows={[["Graded by", product.restorer],["Authentication", product.authenticity]]} /></section>
      <section className="dash-card record-card wide"><CardTitle title="Provenance & acquisition" /><Details rows={[["Acquired from", product.source],["Acquired on", fmtDate(product.acquired)],["Documented provenance", product.provenance],["Restoration record", product.restoration]]} /></section>
      <section className="dash-card record-card"><CardTitle title="Fulfilment" /><Details rows={[["Shipping class", product.shippingClass],["Insured value", money(product.insuredValue)],["Storage", product.location]]} /></section>
      <section className="dash-card record-card"><CardTitle title="Buyer-facing notes" /><p>{product.description}</p><ul>{product.details.map((item) => <li key={item}>{item}</li>)}</ul></section>
    </div>
  </>;
}

function Details({ rows }) { return <dl className="record-details">{rows.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value || "—"}</dd></div>)}</dl>; }

function ProductForm({ existing, close, save }) {
  const defaults = existing || { category: "Decor", stock: 1, grade: "B+", condition: "Good", image: "/images/hero-collection.png", acquired: new Date().toISOString().slice(0, 10), lastGraded: new Date().toISOString().slice(0, 10) };
  function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    save({ ...defaults, ...data, id: existing?.id || crypto.randomUUID(), slug, sku: data.sku || `OSM-${Date.now().toString().slice(-6)}`, era: data.era || `Circa ${data.year}`, note: data.condition, details: [data.materials, data.conditionNotes, "Condition report included", "Insured delivery available"], rating: existing?.rating || 0 });
  }
  const fields = [
    ["name","Object name","text",true],["sku","SKU / inventory no.","text"],["category","Category","text",true],["brand","Brand / workshop","text"],["maker","Maker / attribution","text"],["year","Year made","number"],["era","Displayed era","text"],["origin","Country / place of origin","text"],
    ["materials","Materials","text"],["dimensions","Dimensions","text"],["weight","Weight","text"],["condition","Condition","text"],["grade","Grade","text"],["lastGraded","Last graded","date"],["conditionNotes","Condition notes","textarea",true],
    ["source","Acquired from","text",true],["acquired","Acquisition date","date"],["cost","Purchase cost","number",true],["price","Selling price","number",true],["stock","Quantity","number",true],["location","Storage location","text"],["provenance","Provenance","textarea"],["authenticity","Authentication notes","textarea"],
    ["restorer","Grader / conservator","text"],["restoration","Restoration record","textarea"],["shippingClass","Shipping class","text"],["insuredValue","Insured value","number"],["image","Image path","text"],["description","Buyer-facing description","textarea",true],
  ];
  return <div className="admin-modal"><form className="product-form" onSubmit={submit}><header><div><p>Collection record</p><h2>{existing ? "Edit antique" : "Add an antique"}</h2></div><button type="button" onClick={close}>×</button></header><div className="form-sections">{fields.map(([name,label,type,required]) => <label className={type === "textarea" ? "wide" : ""} key={name}>{label}{type === "textarea" ? <textarea name={name} defaultValue={defaults[name] || ""} required={required} /> : <input name={name} type={type} defaultValue={defaults[name] || ""} required={required} />}</label>)}</div><footer><button type="button" onClick={close}>Cancel</button><button className="primary-admin">Save collection record</button></footer></form></div>;
}

function Orders({ orders, search, select }) {
  const shown = orders.filter((order) => `${order.id} ${order.customer.name} ${order.customer.email}`.toLowerCase().includes(search.toLowerCase()));
  return <><SectionHead eyebrow={`${orders.length} total orders`} title="Orders" copy="Manage payment, packing, delivery, and customer updates." /><div className="data-table orders-table"><div className="table-row table-head"><span>Order</span><span>Customer</span><span>Date</span><span>Payment</span><span>Fulfilment</span><span>Total</span><span /></div>{shown.map((order) => <button className="table-row" key={order.id} onClick={() => select(order.id)}><span><b>{order.id}</b><small>{order.items.length} item(s)</small></span><span><b>{order.customer.name}</b><small>{order.customer.email}</small></span><span><b>{fmtDate(order.date)}</b><small>{new Date(order.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></span><Status value={order.payment?.status} /><Status value={order.status} /><span><b>{money(order.total)}</b><small>{order.customer.country}</small></span><span className="row-arrow">→</span></button>)}</div></>;
}

function OrderRecord({ order, update, back, flash }) {
  if (!order) return null;
  const steps = ["Confirmed", "Packed", "In transit", "Delivered"];
  return <><button className="back-button" onClick={back}>← Back to orders</button><SectionHead eyebrow={`${order.id} · ${fmtDate(order.date)}`} title={order.customer.name} copy={`${order.customer.email} · ${order.customer.phone || "No phone"}`} action={<Status value={order.status} />} />
    <div className="tracking-rail">{steps.map((step, index) => <div className={index <= (order.tracking?.step || 0) ? "done" : ""} key={step}><i>{index < (order.tracking?.step || 0) ? "✓" : index + 1}</i><b>{step}</b></div>)}</div>
    <div className="record-grid order-detail-grid"><section className="dash-card wide"><CardTitle title="Objects" /><div className="order-items">{order.items.map((item) => <div key={item.id}><img src={item.image} alt="" /><span><b>{item.name}</b><small>Quantity {item.quantity}</small></span><strong>{money(item.price * item.quantity)}</strong></div>)}</div><div className="order-totals"><span>Subtotal <b>{money(order.subtotal)}</b></span><span>Shipping <b>{order.shipping ? money(order.shipping) : "Complimentary"}</b></span><span>Total <b>{money(order.total)}</b></span></div></section>
    <section className="dash-card"><CardTitle title="Payment" /><Details rows={[["Status", order.payment?.status],["Method", order.payment?.method],["Transaction", order.payment?.transaction]]} /><button className="secondary-admin full" onClick={() => { update(order.id, { payment: { status: order.payment?.status === "Paid" ? "Refunded" : "Paid" } }); flash("Payment status updated"); }}>{order.payment?.status === "Paid" ? "Issue refund" : "Mark as paid"}</button></section>
    <section className="dash-card"><CardTitle title="Delivery" /><Details rows={[["Carrier", order.tracking?.carrier],["Tracking", order.tracking?.number],["ETA", order.tracking?.eta]]} /><select value={order.status} onChange={(e) => { const next = e.target.value; update(order.id, { status: next, tracking: { step: Math.max(0, steps.indexOf(next)) } }); flash("Fulfilment status updated"); }}>{["Awaiting payment", ...steps].map((s) => <option key={s}>{s}</option>)}</select></section>
    <section className="dash-card"><CardTitle title="Delivery address" /><p>{order.customer.name}<br />{order.customer.address}<br />{order.customer.city}<br />{order.customer.country}</p></section></div></>;
}

function Customers({ orders, search }) {
  const customers = useMemo(() => Object.values(orders.reduce((all, order) => { const key = order.customer.email; all[key] ||= { ...order.customer, orders: 0, spent: 0, last: order.date }; all[key].orders++; all[key].spent += order.total; if (order.date > all[key].last) all[key].last = order.date; return all; }, {})), [orders]);
  return <><SectionHead eyebrow={`${customers.length} client records`} title="Customers" copy="Purchase history, lifetime value, and delivery contacts." /><div className="customer-grid">{customers.filter((c) => `${c.name} ${c.email}`.toLowerCase().includes(search.toLowerCase())).map((customer) => <article className="customer-card" key={customer.email}><span>{customer.name.split(" ").map((n) => n[0]).join("")}</span><h2>{customer.name}</h2><p>{customer.email}<br />{customer.phone}</p><div><b>{customer.orders}<small>Orders</small></b><b>{money(customer.spent)}<small>Lifetime value</small></b></div><footer>{customer.city}, {customer.country}<br />Last order {fmtDate(customer.last)}</footer></article>)}</div></>;
}

function Payments({ orders, update, flash }) {
  const paid = orders.filter((o) => o.payment?.status === "Paid").reduce((s, o) => s + o.total, 0);
  return <><SectionHead eyebrow="Transaction ledger" title="Payments" copy="Review captured, pending, and refunded transactions." /><div className="inventory-summary"><span><b>{money(paid)}</b>Captured</span><span><b>{money(orders.filter((o) => o.payment?.status === "Pending").reduce((s,o) => s + o.total, 0))}</b>Pending</span><span><b>{orders.filter((o) => o.payment?.status === "Paid").length}</b>Successful</span><span><b>{orders.filter((o) => o.payment?.status === "Refunded").length}</b>Refunded</span></div><div className="data-table payment-table">{orders.map((order) => <div className="table-row" key={order.id}><span><b>{order.payment?.transaction}</b><small>{order.id}</small></span><span><b>{order.customer.name}</b><small>{order.payment?.method}</small></span><span><b>{fmtDate(order.date)}</b></span><Status value={order.payment?.status} /><span><b>{money(order.total)}</b></span><button className="text-action" onClick={() => { update(order.id, { payment: { status: order.payment?.status === "Paid" ? "Refunded" : "Paid" } }); flash("Payment status updated"); }}>{order.payment?.status === "Paid" ? "Refund" : "Mark paid"}</button></div>)}</div></>;
}

function Delivery({ orders, update, flash }) {
  return <><SectionHead eyebrow="Insured fulfilment" title="Delivery & tracking" copy="Assign carriers, record tracking numbers, and move orders through delivery." /><div className="delivery-board">{["Packed","In transit","Delivered"].map((column) => <section key={column}><header><h2>{column}</h2><span>{orders.filter((o) => o.status === column).length}</span></header>{orders.filter((o) => o.status === column).map((order) => <article key={order.id}><div><b>{order.id}</b><Status value={order.status} /></div><h3>{order.customer.name}</h3><p>{order.items.map((i) => i.name).join(", ")}</p><small>{order.tracking?.carrier} · {order.tracking?.number}</small>{column !== "Delivered" && <button onClick={() => { const next = column === "Packed" ? "In transit" : "Delivered"; update(order.id, { status: next, tracking: { step: next === "Delivered" ? 4 : 3 } }); flash(`${order.id} moved to ${next}`); }}>Move to {column === "Packed" ? "transit" : "delivered"} →</button>}</article>)}</section>)}</div></>;
}

function Reviews({ reviews, catalog, update, flash }) {
  return <><SectionHead eyebrow={`${reviews.length} customer reviews`} title="Reviews" copy="Moderate feedback and see which objects earn collector confidence." /><div className="review-list">{reviews.map((review) => <article key={review.id}><div className="review-score">{"★".repeat(review.rating)}<small>{fmtDate(review.date)}</small></div><div><h2>{catalog.find((p) => p.id === review.productId)?.name}</h2><p>“{review.text}”</p><span>— {review.customer}</span></div><Status value={review.status} /><div className="review-actions"><button onClick={() => { update(review.id, review.status === "Published" ? "Hidden" : "Published"); flash("Review status updated"); }}>{review.status === "Published" ? "Hide" : "Publish"}</button></div></article>)}</div></>;
}

function Notifications({ items, mark }) {
  return <><SectionHead eyebrow={`${items.filter((i) => !i.read).length} unread`} title="Notifications" copy="Operational alerts across inventory, orders, payments, and customer activity." /><div className="notification-page">{items.map((item) => <button className={item.read ? "read" : ""} key={item.id} onClick={() => mark(item.id)}><i>{item.type === "inventory" ? "!" : item.type === "payment" ? "$" : item.type === "review" ? "★" : "↗"}</i><span><b>{item.title}</b><small>{item.detail}</small></span><time>{item.time}</time>{!item.read && <em>New</em>}</button>)}</div></>;
}
