"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AddToCartButton, PageShell, useCommerce } from "./commerce";
import { products } from "../lib/products";

export function ShopPage() {
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("featured");
  const shown = [...products]
    .filter((product) => category === "All" || product.category === category)
    .sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : 0);
  return <PageShell eyebrow="The complete archive" title="Shop antiques" intro="Every object is one of one, documented honestly, and packed by hand." className="shop-page">
    <div className="shop-toolbar">
      <div className="filters">{["All", ...new Set(products.map((product) => product.category))].map((item) => <button className={category === item ? "active" : ""} onClick={() => setCategory(item)} key={item}>{item}</button>)}</div>
      <label>Sort <select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label>
    </div>
    <div className="product-grid commerce-grid">{shown.map((product, index) => <article className="product" key={product.id}>
      <div className="product-media"><span className="product-number">0{index + 1}</span><Link href={`/product/${product.slug}`}><img src={product.image} alt={product.name} /></Link><AddToCartButton product={product} className="quick-add" /></div>
      <div className="product-meta"><div><p>{product.era} · {product.note}</p><h3><Link href={`/product/${product.slug}`}>{product.name}</Link></h3></div><b>${product.price.toLocaleString()}</b></div>
    </article>)}</div>
  </PageShell>;
}

export function ProductDetail({ product }) {
  const [quantity, setQuantity] = useState(1);
  return <main className="product-page">
    <div className="product-gallery"><div className="product-gallery-main"><img src={product.image} alt={product.name} /><span>One of one</span></div></div>
    <div className="product-info">
      <p className="eyebrow">{product.era} · {product.category}</p><h1>{product.name}</h1><p className="product-price">${product.price.toLocaleString()}</p>
      <p className="product-description">{product.description}</p>
      <ul>{product.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
      <div className="quantity-row"><label>Quantity <select value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}><option value="1">1</option></select></label><span>Only one available</span></div>
      <AddToCartButton product={product} quantity={quantity} className="product-add" />
      <div className="service-notes"><div><b>Authenticity</b><p>Research notes and condition report included.</p></div><div><b>Delivery</b><p>Insured shipping, free above $750.</p></div><div><b>Returns</b><p>14-day inspection period after delivery.</p></div></div>
    </div>
    <section className="related"><p className="eyebrow">You may also consider</p><h2>More from the archive</h2><div className="related-grid">{products.filter((item) => item.id !== product.id).map((item) => <Link href={`/product/${item.slug}`} key={item.id}><img src={item.image} alt={item.name} /><b>{item.name}</b><span>${item.price.toLocaleString()}</span></Link>)}</div></section>
  </main>;
}

export function CartPage() {
  const { items, subtotal, updateQuantity, removeFromCart } = useCommerce();
  const shipping = subtotal >= 750 ? 0 : 45;
  return <PageShell eyebrow="Your selections" title="Shopping cart" intro={`${items.length} ${items.length === 1 ? "object" : "objects"} reserved in this browser.`} className="cart-page">
    {items.length ? <div className="cart-layout">
      <div className="cart-lines">{items.map((item) => <article key={item.id}><Link href={`/product/${item.slug}`}><img src={item.image} alt={item.name} /></Link><div><p>{item.era}</p><h2><Link href={`/product/${item.slug}`}>{item.name}</Link></h2><span>${item.price.toLocaleString()}</span><label>Quantity <select value={item.quantity} onChange={(event) => updateQuantity(item.id, Number(event.target.value))}><option value="1">1</option></select></label><button onClick={() => removeFromCart(item.id)}>Remove</button></div></article>)}</div>
      <OrderSummary subtotal={subtotal} shipping={shipping} action={<Link href="/checkout">Proceed to checkout →</Link>} />
    </div> : <EmptyCart />}
  </PageShell>;
}

function EmptyCart() {
  return <div className="empty-cart"><span>00</span><h2>Your cabinet is empty.</h2><p>Objects are held only after checkout is completed.</p><Link href="/shop">Browse the collection →</Link></div>;
}

function OrderSummary({ subtotal, shipping, action }) {
  return <aside className="order-summary"><p className="eyebrow">Order summary</p><div><span>Subtotal</span><b>${subtotal.toLocaleString()}</b></div><div><span>Insured shipping</span><b>{shipping ? `$${shipping}` : "Complimentary"}</b></div><div className="summary-total"><span>Total</span><b>${(subtotal + shipping).toLocaleString()}</b></div>{action}<small>Taxes, if applicable, are confirmed before dispatch.</small></aside>;
}

export function CheckoutPage() {
  const { items, subtotal, session, signUp, placeOrder } = useCommerce();
  const [createAccount, setCreateAccount] = useState(!session);
  const [error, setError] = useState("");
  const router = useRouter();
  const shipping = subtotal >= 750 ? 0 : 45;

  function submit(event) {
    event.preventDefault();
    setError("");
    if (!items.length) return setError("Your cart is empty.");
    const data = new FormData(event.currentTarget);
    const customer = Object.fromEntries(data);
    if (createAccount && !session) {
      const result = signUp({ name: customer.name, email: customer.email, password: customer.password });
      if (result.error) return setError(result.error);
    }
    const order = placeOrder(customer, { method: "Pay on confirmation" });
    router.push(`/order-success?order=${order.id}`);
  }

  if (!items.length) return <PageShell eyebrow="Secure checkout" title="Checkout"><EmptyCart /></PageShell>;
  return <PageShell eyebrow="Secure checkout" title="Complete your order" intro="No payment key is required yet. This checkout records the order and marks payment for confirmation." className="checkout-page">
    <form className="checkout-layout" onSubmit={submit}>
      <div className="checkout-form">
        <fieldset><legend>01 / Contact</legend><div className="form-grid"><label>Full name<input name="name" required defaultValue={session?.name || ""} autoComplete="name" /></label><label>Email address<input name="email" required type="email" defaultValue={session?.email || ""} autoComplete="email" /></label><label>Phone<input name="phone" required type="tel" autoComplete="tel" /></label></div></fieldset>
        <fieldset><legend>02 / Delivery</legend><div className="form-grid"><label className="wide">Street address<input name="address" required autoComplete="street-address" /></label><label>City<input name="city" required autoComplete="address-level2" /></label><label>State / region<input name="region" required autoComplete="address-level1" /></label><label>Postal code<input name="postalCode" required autoComplete="postal-code" /></label><label>Country<select name="country" required defaultValue="United States"><option>United States</option><option>Bangladesh</option><option>United Kingdom</option><option>Canada</option><option>Australia</option></select></label></div></fieldset>
        {!session && <fieldset><legend>03 / Account</legend><label className="check-row"><input type="checkbox" checked={createAccount} onChange={(event) => setCreateAccount(event.target.checked)} /> Create an account to track this order</label>{createAccount && <label>Password<input name="password" type="password" required minLength="6" autoComplete="new-password" /></label>}</fieldset>}
        <fieldset><legend>{session ? "03" : "04"} / Payment</legend><div className="payment-placeholder"><span>Pay on confirmation</span><p>The store will contact you with a secure payment request after condition and delivery details are reconfirmed.</p></div></fieldset>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="place-order">Place order · ${(subtotal + shipping).toLocaleString()}</button>
      </div>
      <OrderSummary subtotal={subtotal} shipping={shipping} action={null} />
    </form>
  </PageShell>;
}

export function AuthPage({ mode }) {
  const { signIn, signUp, session } = useCommerce();
  const [error, setError] = useState("");
  const router = useRouter();
  const isSignUp = mode === "signup";
  function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = isSignUp
      ? signUp({ name: data.get("name"), email: data.get("email"), password: data.get("password") })
      : signIn(data.get("email"), data.get("password"));
    if (result.error) return setError(result.error);
    router.push("/account");
  }
  if (session) return <PageShell eyebrow="Account" title={`Welcome, ${session.name}`}><div className="auth-card"><p>You are already signed in.</p><Link href="/account">View account →</Link></div></PageShell>;
  return <PageShell eyebrow="Private client ledger" title={isSignUp ? "Create account" : "Sign in"} intro="Save your details and keep a record of your acquisitions." className="auth-page">
    <form className="auth-card" onSubmit={submit}>
      {isSignUp && <label>Full name<input name="name" required autoComplete="name" /></label>}
      <label>Email address<input name="email" type="email" required autoComplete="email" /></label>
      <label>Password<input name="password" type="password" required minLength="6" autoComplete={isSignUp ? "new-password" : "current-password"} /></label>
      {error && <p className="form-error">{error}</p>}<button>{isSignUp ? "Create account" : "Sign in"} →</button>
      <p>{isSignUp ? "Already registered?" : "New to Old Soul?"} <Link href={isSignUp ? "/sign-in" : "/sign-up"}>{isSignUp ? "Sign in" : "Create an account"}</Link></p>
    </form>
  </PageShell>;
}

export function AccountPage() {
  const { session, orders, signOut } = useCommerce();
  if (!session) return <PageShell eyebrow="Private client ledger" title="My account" intro="Sign in to view your orders and saved details."><div className="account-gate"><Link href="/sign-in">Sign in</Link><Link href="/sign-up">Create account</Link></div></PageShell>;
  const ownOrders = orders.filter((order) => order.customer.email.toLowerCase() === session.email.toLowerCase());
  return <PageShell eyebrow="Private client ledger" title={`Hello, ${session.name.split(" ")[0]}`} intro={session.email} className="account-page">
    <div className="account-layout"><aside><Link href="/account">Orders</Link><Link href="/shop">Continue shopping</Link><button onClick={signOut}>Sign out</button></aside><section><h2>Order history</h2>{ownOrders.length ? ownOrders.map((order) => <article className="order-card" key={order.id}><div><b>{order.id}</b><span>{new Date(order.date).toLocaleDateString()}</span></div><div>{order.items.map((item) => <span key={item.id}>{item.name} × {item.quantity}</span>)}</div><div><b>${order.total.toLocaleString()}</b><span>{order.status}</span></div></article>) : <div className="no-orders"><p>No acquisitions recorded yet.</p><Link href="/shop">Explore the collection →</Link></div>}</section></div>
  </PageShell>;
}

export function OrderSuccessPage({ orderId }) {
  return <PageShell eyebrow="Order recorded" title="Thank you." intro={`Your reference is ${orderId || "now in your account"}.`} className="success-page"><div className="success-ticket"><span>Confirmed</span><h2>We are holding your objects.</h2><p>A confirmation has been stored in your account. For production use, the next step is connecting transactional email and a payment provider.</p><div><Link href="/account">View account</Link><Link href="/shop">Continue shopping</Link></div></div></PageShell>;
}
