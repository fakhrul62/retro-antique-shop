"use client";
import { useSearchParams } from "next/navigation";
import { OrderSuccessPage } from "../../components/commerce-pages";
export default function SuccessContent() { return <OrderSuccessPage orderId={useSearchParams().get("order")} />; }
