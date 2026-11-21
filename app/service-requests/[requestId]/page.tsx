import type {Metadata} from "next";
import {ServiceRequestDetailClient} from "@/components/ServiceRequestsClient";
export const metadata:Metadata={title:"Service request"};
export default async function ServiceRequestPage({params}:{params:Promise<{requestId:string}>}){const {requestId}=await params;return <ServiceRequestDetailClient requestId={requestId}/>;}
