import type {Metadata} from "next";
import {VendorServiceRequests} from "@/components/VendorServiceRequests";
export const metadata:Metadata={title:"Vendor service requests"};
export default function VendorServicesPage(){return <VendorServiceRequests/>;}
