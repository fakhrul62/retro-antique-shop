"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { products } from "../lib/products";
import { seedCoupons, seedNotifications, seedOrders, seedReviews, seedUsers } from "../lib/dashboard-data";

const CommerceContext = createContext(null);

export function CommerceProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState(products);
  const [notifications, setNotifications] = useState(seedNotifications);
  const [reviews, setReviews] = useState(seedReviews);
  const [coupons, setCoupons] = useState(seedCoupons);
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [miniCart, setMiniCart] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [added, setAdded] = useState(null);
  const addedTimer = useRef(null);

  useEffect(() => {
    const read = (key, fallback) => {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    };
    const storedUsers = read("old-soul-users", []);
    const mergedUsers = [
      ...seedUsers,
      ...storedUsers.filter((stored) => !seedUsers.some((seed) => seed.email.toLowerCase() === stored.email.toLowerCase())),
    ].map((user) => ({ ...user, role: user.role || "customer" }));
    const storedSession = read("old-soul-session", null);
    const sessionUser = storedSession && mergedUsers.find((user) => user.id === storedSession.id || user.email.toLowerCase() === storedSession.email?.toLowerCase());
    setCart(read("old-soul-cart", []));
    setUsers(mergedUsers);
    setOrders(read("old-soul-orders", seedOrders));
    setCatalog(read("old-soul-catalog", products).map((product) => ({
      ...product,
      listingStatus: product.listingStatus || (product.stock === 0 ? "Sold" : "For sale"),
      saleEnabled: Boolean(product.saleEnabled),
      salePrice: Number(product.salePrice || 0),
    })));
    setNotifications(read("old-soul-notifications", seedNotifications));
    setReviews(read("old-soul-reviews", seedReviews));
    setCoupons(read("old-soul-coupons", seedCoupons));
    setSession(sessionUser ? { id: sessionUser.id, name: sessionUser.name, email: sessionUser.email, role: sessionUser.role } : null);
    setReady(true);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem("old-soul-cart", JSON.stringify(cart)); }, [cart, ready]);
  useEffect(() => { if (ready) localStorage.setItem("old-soul-users", JSON.stringify(users)); }, [users, ready]);
  useEffect(() => { if (ready) localStorage.setItem("old-soul-orders", JSON.stringify(orders)); }, [orders, ready]);
  useEffect(() => { if (ready) localStorage.setItem("old-soul-catalog", JSON.stringify(catalog)); }, [catalog, ready]);
  useEffect(() => { if (ready) localStorage.setItem("old-soul-notifications", JSON.stringify(notifications)); }, [notifications, ready]);
  useEffect(() => { if (ready) localStorage.setItem("old-soul-reviews", JSON.stringify(reviews)); }, [reviews, ready]);
  useEffect(() => { if (ready) localStorage.setItem("old-soul-coupons", JSON.stringify(coupons)); }, [coupons, ready]);
  useEffect(() => { if (ready) localStorage.setItem("old-soul-session", JSON.stringify(session)); }, [session, ready]);
  useEffect(() => () => clearTimeout(addedTimer.current), []);

  const items = useMemo(() => cart.map((entry) => {
    const product = catalog.find((item) => item.id === entry.id);
    return product ? { ...product, price: product.saleEnabled && product.salePrice > 0 ? product.salePrice : product.price, quantity: entry.quantity } : null;
  }).filter(Boolean), [cart, catalog]);
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  function addToCart(product, quantity = 1) {
    const existing = cart.find((item) => item.id === product.id);
    const nextQuantity = (existing?.quantity || 0) + quantity;
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      return found
        ? current.map((item) => item.id === product.id ? { ...item, quantity: nextQuantity } : item)
        : [...current, { id: product.id, quantity }];
    });
    setAdded({ product, quantity: nextQuantity });
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(null), 2200);
  }

  function updateQuantity(id, quantity) {
    if (quantity < 1) return setCart((current) => current.filter((item) => item.id !== id));
    setCart((current) => current.map((item) => item.id === id ? { ...item, quantity } : item));
  }

  function signUp({ name, email, password }) {
    if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) return { error: "An account already exists for this email." };
    const user = { id: crypto.randomUUID(), name, email, password, role: "customer", joined: new Date().toISOString() };
    setUsers((current) => [...current, user]);
    setSession({ id: user.id, name, email, role: user.role });
    return { user };
  }

  function signIn(email, password) {
    const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);
    if (!user) return { error: "The email or password is incorrect." };
    setSession({ id: user.id, name: user.name, email: user.email, role: user.role || "customer" });
    return { user };
  }

  function updateProfile(patch) {
    if (!session) return;
    setUsers((current) => current.map((user) => user.id === session.id ? { ...user, ...patch } : user));
    setSession((current) => ({ ...current, name: patch.name || current.name, email: patch.email || current.email }));
  }

  function placeOrder(customer, payment) {
    const order = {
      id: `OS-${Date.now().toString().slice(-7)}`,
      date: new Date().toISOString(),
      customer,
      payment: { ...payment, status: payment.status || "Pending", transaction: payment.transaction || "Pending" },
      items,
      subtotal,
      shipping: subtotal >= 750 ? 0 : 45,
      total: subtotal + (subtotal >= 750 ? 0 : 45),
      status: "Confirmed",
      tracking: { carrier: "Unassigned", number: "—", eta: "—", step: 1 },
    };
    setOrders((current) => [order, ...current]);
    setCart([]);
    return order;
  }

  function saveProduct(product) {
    const stock = Number(product.stock);
    const normalized = { ...product, price: Number(product.price), cost: Number(product.cost), stock, salePrice: Number(product.salePrice || 0), saleEnabled: Boolean(product.saleEnabled), listingStatus: product.listingStatus || (stock === 0 ? "Sold" : "For sale"), insuredValue: Number(product.insuredValue || product.price), views: Number(product.views || 0), favorites: Number(product.favorites || 0), reviewCount: Number(product.reviewCount || 0), status: stock === 0 ? "Sold" : stock <= 1 ? "Low stock" : "In stock" };
    setCatalog((current) => current.some((item) => item.id === normalized.id) ? current.map((item) => item.id === normalized.id ? normalized : item) : [normalized, ...current]);
    return normalized;
  }

  function updateOrder(id, patch) {
    setOrders((current) => current.map((order) => order.id === id ? { ...order, ...patch, payment: { ...order.payment, ...(patch.payment || {}) }, tracking: { ...order.tracking, ...(patch.tracking || {}) } } : order));
  }

  function saveCoupon(coupon) {
    const normalized = { ...coupon, code: coupon.code.toUpperCase().trim(), value: Number(coupon.value), minimum: Number(coupon.minimum || 0), limit: Number(coupon.limit || 0), used: Number(coupon.used || 0), active: Boolean(coupon.active) };
    setCoupons((current) => current.some((item) => item.id === normalized.id) ? current.map((item) => item.id === normalized.id ? normalized : item) : [normalized, ...current]);
  }

  return (
    <CommerceContext.Provider value={{ ready, items, count, subtotal, cart, addToCart, updateQuantity, removeFromCart: (id) => setCart((current) => current.filter((item) => item.id !== id)), miniCart, setMiniCart, searchOpen, setSearchOpen, added, users, orders, catalog, notifications, reviews, coupons, session, signUp, signIn, signOut: () => setSession(null), updateProfile, placeOrder, saveProduct, updateOrder, saveCoupon, deleteCoupon: (id) => setCoupons((current) => current.filter((item) => item.id !== id)), deleteProduct: (id) => setCatalog((current) => current.filter((item) => item.id !== id)), markNotification: (id) => setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item)), updateReview: (id, status) => setReviews((current) => current.map((item) => item.id === id ? { ...item, status } : item)) }}>
      <GlobalEffects />
      {children}
    </CommerceContext.Provider>
  );
}

export const useCommerce = () => useContext(CommerceContext);

function GlobalEffects() {
  const cursor = useRef(null);
  const pathname = usePathname();
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add("revealed")), { threshold: 0.08 });
    document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));
    const pointer = cursor.current;
    let hideTimer;
    const move = (event) => {
      pointer.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
      pointer.classList.add("moving");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => pointer.classList.remove("moving"), 260);
    };
    if (matchMedia("(pointer:fine)").matches) window.addEventListener("pointermove", move);
    return () => {
      observer.disconnect();
      clearTimeout(hideTimer);
      window.removeEventListener("pointermove", move);
    };
  }, [pathname]);
  return <div className="retro-cursor" ref={cursor} aria-hidden="true"><span className="cursor-chain" /><span className="cursor-watch"><i /></span></div>;
}

export function AnalogLogo({ time }) {
  return (
    <span className="logo-clock" aria-hidden="true">
      <i className="clock-rim" />
      <i className="clock-ticks">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ "--tick": `${index * 30}deg` }} />)}</i>
      <i className="clock-number twelve">XII</i><i className="clock-number three">III</i><i className="clock-number six">VI</i><i className="clock-number nine">IX</i>
      <i className="clock-hand hour" style={{ "--angle": `${time ? (time.getHours() % 12) * 30 + time.getMinutes() / 2 : 0}deg` }} />
      <i className="clock-hand minute" style={{ "--angle": `${time ? time.getMinutes() * 6 + time.getSeconds() / 10 : 0}deg` }} />
      <i className="clock-hand second" style={{ "--angle": `${time ? time.getSeconds() * 6 : 0}deg` }} />
      <i className="clock-pin" /><b>OS</b>
    </span>
  );
}

export function SiteHeader() {
  const [time, setTime] = useState(null);
  const [menu, setMenu] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { count, items, subtotal, miniCart, setMiniCart, searchOpen, setSearchOpen, removeFromCart, added, session, signOut } = useCommerce();
  const pathname = usePathname();
  const cartButton = useRef(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { setMenu(false); setMiniCart(false); setSearchOpen(false); setAccountOpen(false); }, [pathname, setMiniCart, setSearchOpen]);
  useEffect(() => {
    document.body.style.overflow = menu || searchOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menu, searchOpen]);

  return (
    <>
      <div className="announcement">Complimentary insured shipping on orders over $750 <span>•</span> Worldwide delivery</div>
      <header className="header sticky-header">
        <Link className="brand" href="/" aria-label="Old Soul Mercantile home"><AnalogLogo time={time} /><strong>Old Soul<br />Mercantile</strong></Link>
        <nav className={menu ? "nav open" : "nav"} aria-label="Main navigation">
          <Link href="/shop">Shop</Link><Link href="/#collections">Collections</Link><Link href="/#story">Our Story</Link><Link href="/#journal">Journal</Link>
        </nav>
        <div className="header-actions">
          <button className="icon-button search-toggle" aria-label="Open search" onClick={() => setSearchOpen(true)}>⌕</button>
          <div className="account-menu">
            <button className={`user-button ${session ? "signed-in" : ""}`} onClick={() => setAccountOpen((open) => !open)} aria-label={session ? `Open ${session.name} account menu` : "Open sign in menu"} aria-expanded={accountOpen}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.25" /><path d="M5.5 20c.35-4.15 2.52-6.25 6.5-6.25S18.15 15.85 18.5 20" /></svg>
              {session && <i />}
            </button>
            {accountOpen && <div className="account-popover">
              {session ? <>
                <div className="account-popover-id"><span>{session.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span><div><b>{session.name}</b><small>{session.role === "admin" ? "Administrator" : "Customer account"}</small></div></div>
                <Link href={session.role === "admin" ? "/admin" : "/account"}>{session.role === "admin" ? "Open admin dashboard" : "Open my account"} <span>→</span></Link>
                <button onClick={() => { signOut(); setAccountOpen(false); }}>Sign out <span>↗</span></button>
              </> : <>
                <div className="account-popover-copy"><b>Your private ledger</b><small>Sign in as a customer or administrator.</small></div>
                <Link href="/sign-in">Sign in <span>→</span></Link>
                <Link href="/sign-up">Create customer account <span>→</span></Link>
              </>}
            </div>}
          </div>
          <button ref={cartButton} className={`cart-button ${added ? "cart-bump" : ""}`} onClick={() => setMiniCart(!miniCart)} aria-expanded={miniCart}>Cart <span>{String(count).padStart(2, "0")}</span></button>
          <button className="menu-button" onClick={() => setMenu(!menu)} aria-label="Toggle menu" aria-expanded={menu}>{menu ? "×" : "Menu"}</button>
        </div>
        {added && <div className="added-toast" role="status">
          <span className="toast-seal">OS</span>
          <span className="toast-copy"><small>Added to cart</small><b>{added.product.name}</b></span>
          <span className="toast-quantity">Qty {added.quantity}</span>
        </div>}
        {miniCart && (
          <aside className="mini-cart" aria-label="Shopping cart">
            <div className="mini-cart-head"><span>Cart / {count}</span><button onClick={() => setMiniCart(false)}>Close ×</button></div>
            {items.length ? <>
              <div className="mini-cart-items">{items.map((item) => <div className="mini-cart-item" key={item.id}><img src={item.image} alt="" /><div><Link href={`/product/${item.slug}`}>{item.name}</Link><span>{item.quantity} × ${item.price.toLocaleString()}</span></div><button aria-label={`Remove ${item.name}`} onClick={() => removeFromCart(item.id)}>×</button></div>)}</div>
              <div className="mini-cart-total"><span>Subtotal</span><b>${subtotal.toLocaleString()}</b></div>
              <div className="mini-cart-actions"><Link href="/cart">View cart</Link><Link href="/checkout">Checkout →</Link></div>
            </> : <div className="empty-mini"><p>Your cabinet is empty.</p><Link href="/shop">Browse the collection →</Link></div>}
          </aside>
        )}
      </header>
      {searchOpen && <SearchOverlay close={() => setSearchOpen(false)} />}
    </>
  );
}

export function SiteFooter() {
  const [time, setTime] = useState(null);
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return <footer id="footer">
    <div className="footer-top"><Link className="brand" href="/"><AnalogLogo time={time} /><strong>Old Soul<br />Mercantile</strong></Link><p>Good objects outlive us.<br />Choose accordingly.</p></div>
    <div className="footer-links"><div><b>Shop</b><Link href="/shop">New arrivals</Link><Link href="/shop">Collections</Link><Link href="/cart">Cart</Link></div><div><b>Information</b><Link href="/#story">About</Link><Link href="/#journal">Journal</Link><Link href="/checkout">Shipping & checkout</Link></div><div><b>Account</b><Link href="/account">My account</Link><Link href="/sign-in">Sign in</Link><Link href="/sign-up">Create account</Link></div></div>
    <div className="footer-word">OLD SOUL</div>
    <div className="footer-bottom"><span>© 2026 Old Soul Mercantile</span><span>Hudson, New York</span><span>Objects with a past</span></div>
  </footer>;
}

function SearchOverlay({ close }) {
  const { catalog } = useCommerce();
  const [query, setQuery] = useState("");
  const input = useRef(null);
  useEffect(() => {
    input.current?.focus();
    const escape = (event) => event.key === "Escape" && close();
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [close]);
  const results = catalog.filter((product) => `${product.name} ${product.category} ${product.era}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="search-overlay">
    <div className="search-dialog">
      <div className="search-dialog-head"><span>Search the archive</span><button onClick={close}>Close ×</button></div>
      <label><span>Search</span><input ref={input} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Clock, porcelain, 1890…" /></label>
      <div className="search-results">
        {query ? results.map((product) => <Link href={`/product/${product.slug}`} key={product.id}><img src={product.image} alt="" /><span><b>{product.name}</b><small>{product.era} · ${product.price.toLocaleString()}</small></span><i>↗</i></Link>) : <p>Type a name, era, or category.</p>}
        {query && !results.length && <p>No objects found. Try another term.</p>}
      </div>
    </div>
  </div>;
}

export function AddToCartButton({ product, quantity = 1, className = "" }) {
  const { addToCart, added } = useCommerce();
  const isAdded = added?.product.id === product.id;
  const unavailable = product.stock === 0 || (product.listingStatus && product.listingStatus !== "For sale");
  return <button disabled={unavailable} className={`commerce-button ${className} ${isAdded ? "is-added" : ""}`} onClick={() => addToCart(product, quantity)}>{unavailable ? product.listingStatus || "Unavailable" : isAdded ? "Added to cart" : "Add to cart"} <span>{isAdded ? "✓" : unavailable ? "—" : "+"}</span></button>;
}

export function PageShell({ eyebrow, title, intro, children, className = "" }) {
  return <main className={`inner-page ${className}`}><header className="page-title"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{intro && <p>{intro}</p>}</header>{children}</main>;
}
