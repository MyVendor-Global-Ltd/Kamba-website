import type {Metadata} from "next";
import {AdminDisputeQueue} from "@/components/admin/AdminDisputeQueue";
export const metadata:Metadata={title:"Dispute review"};
export default function AdminDisputesPage(){return <AdminDisputeQueue/>;}
