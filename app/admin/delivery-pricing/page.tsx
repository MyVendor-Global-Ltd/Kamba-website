import type {Metadata} from "next";
import {DeliveryPricingManager} from "@/components/admin/DeliveryPricingManager";
export const metadata:Metadata={title:"Admin · Delivery pricing"};
export default function AdminDeliveryPricingPage(){return <DeliveryPricingManager/>;}