import type {Metadata} from "next";
import {AuthForms} from "@/components/AuthForms";
export const metadata:Metadata={title:"Create account"};
export default function RegisterPage(){return <section className="catalog-page auth-page"><AuthForms mode="register"/></section>;}