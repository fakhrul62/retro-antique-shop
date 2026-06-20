import { notFound } from "next/navigation";
import { ProductDetail } from "../../../components/commerce-pages";
import { productBySlug, products } from "../../../lib/products";

export function generateStaticParams() { return products.map((product) => ({ slug: product.slug })); }
export async function generateMetadata({ params }) {
  const product = productBySlug((await params).slug);
  return product ? { title: `${product.name} — Old Soul Mercantile`, description: product.description } : {};
}
export default async function Page({ params }) {
  const product = productBySlug((await params).slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
