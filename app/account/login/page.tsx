import type {Metadata} from "next";
import {AuthForms} from "@/components/AuthForms";
export const metadata:Metadata={title:"Sign in"};
export default function LoginPage(){return <section className="catalog-page auth-page"><AuthForms mode="login"/></section>;}