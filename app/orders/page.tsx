import type {Metadata} from "next";
import {OrdersClient} from "@/components/OrdersClient";
export const metadata:Metadata={title:"Order history"};
export default function OrdersPage(){return <OrdersClient/>;}
