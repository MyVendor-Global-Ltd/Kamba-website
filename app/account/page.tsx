import type {Metadata} from "next";
import Link from "next/link";
export const metadata:Metadata={title:"Account"};
export default function AccountPage(){return <section className="catalog-page"><div className="account-panel"><p className="eyebrow">WELCOME TO KAMBA</p><h1>Your community<br/><em>is waiting.</em></h1><p>Account sign-in and registration will connect to Kamba&apos;s existing authentication API in the authentication integration milestone.</p><Link className="button" href="/">Back to marketplace →</Link></div></section>;}