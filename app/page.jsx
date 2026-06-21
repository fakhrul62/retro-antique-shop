"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AddToCartButton, useCommerce } from "../components/commerce";

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function Home() {
  const { catalog: products } = useCommerce();
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [openJournal, setOpenJournal] = useState(null);
  const filtered = useMemo(() => products.filter((product) =>
    (category === "All" || product.category === category) &&
    product.name.toLowerCase().includes(query.toLowerCase())
  ), [category, query]);

  function subscribe(event) {
    event.preventDefault();
    setMessage("Welcome to the ledger. Watch your inbox.");
    event.currentTarget.reset();
  }

  return (
    <main>
      <section className="hero" id="top">
        <img src="/images/hero-collection.png" alt="Antique clock, books, and writing desk in a warmly lit study" />
        <div className="hero-shade" />
        <div className="hero-copy">
          <p className="eyebrow">Est. 1974 · Hudson Valley, NY</p>
          <h1>Objects with<br />a past.</h1>
          <p>Exceptional antiques chosen for character, craft, and the stories held in every mark.</p>
          <Link className="button light" href="/shop"><span>Explore the collection</span><Arrow /></Link>
        </div>
        <div className="hero-index"><span>Collection 06</span><i /><span>Summer 2026</span></div>
      </section>

      <section className="proof reveal">
        <p>Every object is researched, authenticated, and prepared to live another century.</p>
        <div><span><b>52</b> years sourcing</span><span><b>1,840</b> pieces restored</span><span><b>38</b> countries shipped</span></div>
      </section>

      <section className="shop-section reveal" id="new">
        <div className="section-heading">
          <div><p className="eyebrow">Fresh from the estate</p><h2>New arrivals</h2></div>
          <p>Singular pieces, added weekly. Once they find a home, they are gone.</p>
        </div>
        <div className="catalog-tools">
          <div className="filters" aria-label="Filter products">
            {["All", "Sound", "Curios", "Decor"].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <label className="search"><span>Search</span><input id="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find an object…" /></label>
        </div>
        <div className="product-grid">
          {filtered.map((product, index) => (
            <article className="product" key={product.id}>
              <div className="product-media" data-cursor="VIEW">
                <span className="product-number">0{index + 1}</span>
                <Link href={`/product/${product.slug}`}><img src={product.image} alt={product.name} /></Link>
                <AddToCartButton product={product} className="quick-add" />
              </div>
              <div className="product-meta"><div><p>{product.era} · {product.note}</p><h3><Link href={`/product/${product.slug}`}>{product.name}</Link></h3></div><b>${product.price.toLocaleString()}</b></div>
            </article>
          ))}
          {!filtered.length && <p className="empty">No objects match that search.</p>}
        </div>
        <Link className="shop-all-link" href="/shop">View the full collection <Arrow /></Link>
      </section>

      <section className="collections reveal" id="collections">
        <div className="collection-title"><p className="eyebrow">Browse by room</p><h2>A house of<br /><em>curiosities.</em></h2></div>
        <div className="collection-list">
          {["The Study", "The Drawing Room", "The Cabinet", "The Atelier"].map((name, index) => <Link href={`/shop?room=${encodeURIComponent(name)}`} key={name}><span>0{index + 1}</span><b>{name}</b><i>{["Books, desks & instruments", "Lighting, seating & objects", "Small wonders & ephemera", "Art, textiles & ceramics"][index]}</i><Arrow /></Link>)}
        </div>
      </section>

      <section className="story reveal" id="story">
        <div className="story-mark" data-cursor="SINCE 1974">
          <i className="story-ring ring-one" /><i className="story-ring ring-two" />
          <span className="story-cross horizontal" /><span className="story-cross vertical" />
          <b>OS</b><small>1974</small>
        </div>
        <div><p className="eyebrow">Our point of view</p><h2>We do not sell old things. We place history in new hands.</h2><p>For five decades, our family has crossed auction rooms, country houses, and forgotten workshops to find objects with an unmistakable presence. We restore sparingly and document honestly.</p><Link className="text-link" href="/shop">Browse the archive <Arrow /></Link></div>
      </section>

      <section className="journal reveal" id="journal">
        <div className="section-heading"><div><p className="eyebrow">Useful notes from the archive</p><h2>The journal</h2></div><p>Short guides for understanding, caring for, and collecting old objects.</p></div>
        <div className="journal-grid">
          <article className={openJournal === 1 ? "journal-card open" : "journal-card"}>
            <span>Field Notes · 8 min</span>
            <div className="journal-media"><img src="/images/hero-collection.png" alt="An antique mantel clock in a study" /><b>01</b></div>
            <h3>How to hear the age of a clock</h3>
            <p>A practical field guide to movements, chimes, repairs, and the clues hidden behind the dial.</p>
            <div className="journal-detail">Listen for an even beat, inspect screw heads for recent tooling, and compare the movement number with the case. A mismatched movement is not always a flaw, but it should always be disclosed.</div>
            <button onClick={() => setOpenJournal(openJournal === 1 ? null : 1)}>{openJournal === 1 ? "Close notes" : "Read field notes"} <Arrow /></button>
          </article>
          <article className={openJournal === 2 ? "journal-card open" : "journal-card"}>
            <span>Care Guide · 6 min</span>
            <div className="journal-media"><img src="/images/pocket-watch.png" alt="Engraved antique silver pocket watches" /><b>02</b></div>
            <h3>When patina should be left alone</h3>
            <p>How to distinguish honest age from active damage before reaching for polish or restoration.</p>
            <div className="journal-detail">Stable oxidation often protects the material and records its history. Remove loose dirt with a dry soft brush; stop when cleaning begins to change the object’s color or surface character.</div>
            <button onClick={() => setOpenJournal(openJournal === 2 ? null : 2)}>{openJournal === 2 ? "Close notes" : "Read care guide"} <Arrow /></button>
          </article>
        </div>
      </section>

      <section className="newsletter reveal">
        <p className="eyebrow">The private ledger</p><h2>Rare finds.<br />First notice.</h2>
        <p>Join for early access to new acquisitions and notes from our travels.</p>
        <form onSubmit={subscribe}><label><span>Email address</span><input required type="email" placeholder="you@example.com" /></label><button>Join the ledger <Arrow /></button></form>
        <div className="form-message" role="status">{message}</div>
      </section>

    </main>
  );
}
