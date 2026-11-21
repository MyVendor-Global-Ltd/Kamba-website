import type {Metadata} from "next";
import {OrderDetailClient} from "@/components/OrdersClient";
export const metadata:Metadata={title:"Order details"};
export default async function OrderDetailPage({params}:{params:Promise<{orderId:string}>}){const {orderId}=await params;return <OrderDetailClient orderId={orderId}/>;}
