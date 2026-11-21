import type {Metadata} from "next";
import {ServiceRequestsClient} from "@/components/ServiceRequestsClient";
export const metadata:Metadata={title:"Service requests"};
export default function ServiceRequestsPage(){return <ServiceRequestsClient/>;}
