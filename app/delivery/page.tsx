import type {Metadata} from "next";
import {DeliveryProviderDashboard} from "@/components/DeliveryProviderDashboard";
export const metadata:Metadata={title:"Delivery provider workspace"};
export default function DeliveryPage(){return <DeliveryProviderDashboard/>;}
