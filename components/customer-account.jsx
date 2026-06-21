"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell, useCommerce } from "./commerce";

export function CustomerAccount() {
  const { ready, session, users, orders, signOut, updateProfile } = useCommerce();
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [selected, setSelected] = useState(null);
  const [saved, setSaved] = useState("");
  useEffect(() => {
    if (ready && session?.role === "admin") router.replace("/admin");
  }, [ready, session, router]);
  if (!ready) return <PageShell eyebrow="Private client ledger" title="Checking account…" />;
  if (!session) return <PageShell eyebrow="Private client ledger" title="My account" intro="Sign in to view your orders, payments, and delivery details."><div className="account-gate"><Link href="/sign-in">Sign in</Link><Link href="/sign-up">Create account</Link></div><p className="account-demo">Demo account: <b>eleanor@example.com</b> / <b>collector</b></p></PageShell>;
  if (session.role === "admin") return <PageShell eyebrow="Administrator session" title="Opening dashboard…" />;

  const ownOrders = orders.filter((order) => order.customer.email.toLowerCase() === session.email.toLowerCase());
  const profile = users.find((user) => user.id === session.id) || session;
  const currentOrder = ownOrders.find((order) => order.id === selected);
  const paidTotal = ownOrders.filter((order) => order.payment?.status === "Paid").reduce((sum, order) => sum + order.total, 0);

  function saveProfile(event) {
    event.preventDefault();
    updateProfile(Object.fromEntries(new FormData(event.currentTarget)));
    setSaved("Profile updated");
    setTimeout(() => setSaved(""), 1800);
  }

  return <PageShell eyebrow="Private client ledger" title={`Hello, ${session.name.split(" ")[0]}`} intro="Your acquisitions, payments, delivery updates, and private details." className="account-page customer-portal">
    <div className="customer-shell">
      <aside className="customer-nav">
        <div className="customer-identity"><span>{session.name.split(" ").map((name) => name[0]).join("")}</span><b>{session.name}</b><small>Collector since {profile.joined ? new Date(profile.joined).getFullYear() : "2026"}</small></div>
        {[["overview","Overview"],["orders","My orders"],["tracking","Track delivery"],["payments","Payment history"],["profile","Profile & address"]].map(([id,label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setSelected(null); }}>{label}<span>→</span></button>)}
        <Link href="/shop">Continue shopping <span>↗</span></Link><button onClick={signOut}>Sign out <span>↗</span></button>
      </aside>
      <section className="customer-content">
        {tab === "overview" && <><Heading eyebrow="Account overview" title="Your collection ledger" /><div className="customer-stats"><article><span>Total orders</span><b>{ownOrders.length}</b><small>{ownOrders.filter((order) => order.status !== "Delivered").length} active</small></article><article><span>Collection value</span><b>${paidTotal.toLocaleString()}</b><small>Paid acquisitions</small></article><article><span>In transit</span><b>{ownOrders.filter((order) => order.status === "In transit").length}</b><small>Insured deliveries</small></article></div><OrderList orders={ownOrders.slice(0,3)} select={(id) => { setSelected(id); setTab("orders"); }} /><div className="customer-note"><span>OS</span><div><b>Your collector profile</b><p>{profile.preferences || "Tell us what you collect so we can share relevant private acquisitions."}</p></div><button onClick={() => setTab("profile")}>Edit interests →</button></div></>}
        {tab === "orders" && !currentOrder && <><Heading eyebrow="Acquisition archive" title="My orders" /><OrderList orders={ownOrders} select={setSelected} /></>}
        {tab === "orders" && currentOrder && <OrderDetail order={currentOrder} back={() => setSelected(null)} />}
        {tab === "tracking" && <><Heading eyebrow="Insured delivery" title="Track orders" />{ownOrders.filter((order) => order.status !== "Delivered").map((order) => <Tracking order={order} key={order.id} />)}{!ownOrders.some((order) => order.status !== "Delivered") && <p className="no-orders">No active deliveries.</p>}</>}
        {tab === "payments" && <><Heading eyebrow="Transaction archive" title="Payment history" /><div className="customer-payment-list">{ownOrders.map((order) => <article key={order.id}><span><b>{order.id}</b><small>{new Date(order.date).toLocaleDateString()} · {order.payment?.method}</small></span><i className={order.payment?.status?.toLowerCase()}>{order.payment?.status}</i><strong>${order.total.toLocaleString()}</strong><button onClick={() => window.print()}>Receipt ↓</button></article>)}</div><p className="payment-security">Card numbers are never stored here. Production payments require a PCI-compliant provider such as Stripe.</p></>}
        {tab === "profile" && <><Heading eyebrow="Personal details" title="Profile & delivery address" /><form className="profile-form" onSubmit={saveProfile}>{[["name","Full name"],["email","Email address"],["phone","Phone"],["address","Street address"],["city","City"],["region","State / region"],["postalCode","Postal code"],["country","Country"],["preferences","Collecting interests"]].map(([name,label]) => <label className={name === "address" || name === "preferences" ? "wide" : ""} key={name}>{label}<input name={name} defaultValue={profile[name] || ""} required={["name","email"].includes(name)} /></label>)}<button>Save profile</button>{saved && <span className="profile-saved">✓ {saved}</span>}</form></>}
      </section>
    </div>
  </PageShell>;
}

function Heading({ eyebrow, title }) { return <header className="customer-section-head"><p>{eyebrow}</p><h2>{title}</h2></header>; }
function OrderList({ orders, select }) { return <div className="customer-order-list">{orders.length ? orders.map((order) => <button key={order.id} onClick={() => select(order.id)}><span className="customer-order-image"><img src={order.items[0]?.image} alt="" /></span><span><b>{order.items.map((item) => item.name).join(", ")}</b><small>{order.id} · {new Date(order.date).toLocaleDateString()}</small></span><i className={`customer-status ${order.status.toLowerCase().replaceAll(" ","-")}`}>{order.status}</i><strong>${order.total.toLocaleString()}</strong><em>→</em></button>) : <div className="no-orders"><p>No acquisitions recorded yet.</p><Link href="/shop">Explore the collection →</Link></div>}</div>; }
function OrderDetail({ order, back }) { return <><button className="customer-back" onClick={back}>← All orders</button><Heading eyebrow={`${order.id} · ${new Date(order.date).toLocaleDateString()}`} title="Order details" /><Tracking order={order} /><div className="customer-detail-grid"><section><h3>Objects</h3>{order.items.map((item) => <div className="customer-line" key={item.id}><img src={item.image} alt="" /><span><b>{item.name}</b><small>Quantity {item.quantity}</small></span><strong>${(item.price * item.quantity).toLocaleString()}</strong></div>)}<div className="customer-total"><span>Total paid</span><b>${order.total.toLocaleString()}</b></div></section><section><h3>Delivery</h3><p>{order.customer.name}<br />{order.customer.address}<br />{order.customer.city}<br />{order.customer.country}</p><h3>Payment</h3><p>{order.payment?.method}<br />{order.payment?.status} · {order.payment?.transaction}</p></section></div></>; }
function Tracking({ order }) { const steps = ["Confirmed","Packed","In transit","Delivered"]; return <article className="customer-tracking"><header><div><span>{order.id}</span><h3>{order.items.map((item) => item.name).join(", ")}</h3></div><b>{order.tracking?.eta !== "—" ? `Est. ${new Date(order.tracking.eta).toLocaleDateString()}` : "Preparing details"}</b></header><div>{steps.map((step,index) => <span className={index <= (order.tracking?.step || 0) ? "done" : ""} key={step}><i>{index < (order.tracking?.step || 0) ? "✓" : index + 1}</i><b>{step}</b></span>)}</div><footer><span>{order.tracking?.carrier}</span><b>{order.tracking?.number}</b>{order.tracking?.number !== "—" && <button onClick={() => navigator.clipboard?.writeText(order.tracking.number)}>Copy tracking</button>}</footer></article>; }
