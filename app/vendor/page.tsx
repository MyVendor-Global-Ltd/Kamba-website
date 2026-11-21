import type {Metadata} from "next";
import {VendorDashboard} from "@/components/VendorDashboard";
export const metadata:Metadata={title:"Vendor workspace"};
export default function VendorPage(){return <VendorDashboard/>;}
