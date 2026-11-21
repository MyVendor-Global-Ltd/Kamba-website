import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {getService} from "@/lib/api";
import {ServiceRequestForm} from "@/components/ServiceRequestForm";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const {slug}=await params;try{const service=await getService(slug);return {title:service?.service_title||"Service"};}catch{return {title:"Service"};}}
export default async function ServiceDetailPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;let service=null;try{service=await getService(slug);}catch{}if(!service)notFound();return <section className="catalog-page detail-page"><Link className="back-link" href="/services">← Back to services</Link><div className="detail-layout"><div className="detail-art"><span>✳</span></div><div className="detail-copy"><p className="eyebrow">{service.category||"COMMUNITY SERVICE"}</p><h1>{service.service_title}</h1><strong className="detail-price">{service.price_range||"Request a quote"}</strong><p>{service.description||"Contact this provider to discuss what you need."}</p><p className="detail-store">{service.location_text||"Campus community"}</p><div className="notice">Submit a booking request or ask for a quotation. You only pay after reviewing and accepting the provider&apos;s quote.</div><ServiceRequestForm serviceId={service.id}/></div></div></section>;}
