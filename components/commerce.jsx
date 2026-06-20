"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { products } from "../lib/products";

const CommerceContext = createContext(null);

export function CommerceProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [miniCart, setMiniCart] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [added, setAdded] = useState(null);

  useEffect(() => {
    const read = (key, fallback) => {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    };
    setCart(read("old-soul-cart", []));
    setUsers(read("old-soul-users", []));
    setOrders(read("old-soul-orders", []));
    setSession(read("old-soul-session", null));
    setReady(true);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem("old-soul-cart", JSON.stringify(cart)); }, [cart, ready]);
  useEffect(() => { if (ready) localStorage.setItem("old-soul-users", JSON.stringify(users)); }, [users, ready]);
  useEffect(() => { if (ready) localStorage.setItem("old-soul-orders", JSON.stringify(orders)); }, [orders, ready]);
  useEffect(() => { if (ready) localStorage.setItem("old-soul-session", JSON.stringify(session)); }, [session, ready]);

  const items = useMemo(() => cart.map((entry) => ({ ...products.find((product) => product.id === entry.id), quantity: entry.quantity })).filter((item) => item.id), [cart]);
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  function addToCart(product, quantity = 1) {
    setCart((current) => {
      const found = current.find((item) => item.id === product.id);
      return found
        ? current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } : item)
        : [...current, { id: product.id, quantity: Math.min(quantity, product.stock) }];
    });
    setAdded(product);
    setMiniCart(true);
    clearTimeout(addToCart.timer);
    addToCart.timer = setTimeout(() => setAdded(null), 1500);
  }

  function updateQuantity(id, quantity) {
    if (quantity < 1) return setCart((current) => current.filter((item) => item.id !== id));
    const product = products.find((item) => item.id === id);
    setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: Math.min(quantity, product.stock) } : item));
  }

  function signUp({ name, email, password }) {
    if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) return { error: "An account already exists for this email." };
    const user = { id: crypto.randomUUID(), name, email, password };
    setUsers((current) => [...current, user]);
    setSession({ id: user.id, name, email });
    return { user };
  }

  function signIn(email, password) {
    const user = users.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);
    if (!user) return { error: "The email or password is incorrect." };
    setSession({ id: user.id, name: user.name, email: user.email });
    return { user };
  }

  function placeOrder(customer, payment) {
    const order = {
      id: `OS-${Date.now().toString().slice(-7)}`,
      date: new Date().toISOString(),
      customer,
      payment,
      items,
      subtotal,
      shipping: subtotal >= 750 ? 0 : 45,
      total: subtotal + (subtotal >= 750 ? 0 : 45),
      status: "Confirmed",
    };
    setOrders((current) => [order, ...current]);
    setCart([]);
    return order;
  }

  return (
    <CommerceContext.Provider value={{ items, count, subtotal, cart, addToCart, updateQuantity, removeFromCart: (id) => setCart((current) => current.filter((item) => item.id !== id)), miniCart, setMiniCart, searchOpen, setSearchOpen, added, users, orders, session, signUp, signIn, signOut: () => setSession(null), placeOrder }}>
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
    const move = (event) => {
      pointer.style.transform = `translate3d(${event.clientX}px,${event.clientY}px,0)`;
      const target = event.target.closest("a, button, .product-media, .journal-media, .story-mark");
      pointer.classList.toggle("active", Boolean(target));
      pointer.querySelector("span").textContent = target?.dataset.cursor || (target ? "GO" : "");
    };
    if (matchMedia("(pointer:fine)").matches) window.addEventListener("pointermove", move);
    return () => { observer.disconnect(); window.removeEventListener("pointermove", move); };
  }, [pathname]);
  return <div className="retro-cursor" ref={cursor}><span /></div>;
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
  const { count, items, subtotal, miniCart, setMiniCart, searchOpen, setSearchOpen, removeFromCart, added, session } = useCommerce();
  const pathname = usePathname();
  const cartButton = useRef(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { setMenu(false); setMiniCart(false); setSearchOpen(false); }, [pathname, setMiniCart, setSearchOpen]);
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
          <Link className="account-link" href="/account">{session ? session.name.split(" ")[0] : "Account"}</Link>
          <button ref={cartButton} className={`cart-button ${added ? "cart-bump" : ""}`} onClick={() => setMiniCart(!miniCart)} aria-expanded={miniCart}>Cart <span>{String(count).padStart(2, "0")}</span></button>
          <button className="menu-button" onClick={() => setMenu(!menu)} aria-label="Toggle menu" aria-expanded={menu}>{menu ? "×" : "Menu"}</button>
        </div>
        {added && <div className="added-toast" role="status"><span>Added</span><b>{added.name}</b><i>→</i></div>}
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

function SearchOverlay({ close }) {
  const [query, setQuery] = useState("");
  const input = useRef(null);
  useEffect(() => {
    input.current?.focus();
    const escape = (event) => event.key === "Escape" && close();
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [close]);
  const results = products.filter((product) => `${product.name} ${product.category} ${product.era}`.toLowerCase().includes(query.toLowerCase()));
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
  const { addToCart } = useCommerce();
  return <button className={`commerce-button ${className}`} onClick={() => addToCart(product, quantity)}>Add to cart <span>+</span></button>;
}

export function PageShell({ eyebrow, title, intro, children, className = "" }) {
  return <main className={`inner-page ${className}`}><header className="page-title"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{intro && <p>{intro}</p>}</header>{children}</main>;
}
