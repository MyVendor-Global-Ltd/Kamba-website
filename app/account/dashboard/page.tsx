"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
type User={id:string;email:string;username:string;role:string;is_active:boolean};
export default function AccountDashboardPage(){
 const router=useRouter();
 const [user,setUser]=useState<User|null>(null);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState("");
 const [signingOut,setSigningOut]=useState(false);
 useEffect(()=>{
  let active=true;
  async function loadAccount(){
   try{
    let response=await fetch("/api/backend/auth/dashboard",{credentials:"same-origin",cache:"no-store"});
    if(response.status===401){
     const refreshed=await fetch("/api/backend/auth/refresh",{method:"POST",credentials:"same-origin",cache:"no-store"});
     if(refreshed.ok)response=await fetch("/api/backend/auth/dashboard",{credentials:"same-origin",cache:"no-store"});
    }
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.success||!data.result?.id)throw new Error(data.message||"Your session has expired.");
    if(active)setUser(data.result);
   }catch(err){
    if(active){
     setError(err instanceof Error?err.message:"Unable to load your account.");
     router.replace("/account/login");
    }
   }finally{if(active)setLoading(false);}
  }
  loadAccount();
  return()=>{active=false;};
 },[router]);
 async function signOut(){
  setSigningOut(true);
  try{await fetch("/api/backend/auth/logout",{method:"POST",credentials:"same-origin"});}
  finally{router.replace("/");router.refresh();}
 }
 if(loading)return <section className="catalog-page"><div className="empty"><h3>Loading your account…</h3></div></section>;
 if(error||!user)return <section className="catalog-page"><div className="empty"><h3>Sign-in required</h3><p>{error||"Please sign in to view your account."}</p><Link className="button" href="/account/login">Sign in →</Link></div></section>;
 return <section className="catalog-page"><div className="account-panel"><p className="eyebrow">YOUR KAMBA ACCOUNT</p><h1>Welcome,<br/><em>@{user.username}</em></h1><p>{user.email}</p><div className="dashboard-meta"><span>Account type</span><strong>{user.role}</strong></div><div className="dashboard-actions"><Link className="button" href="/products">Browse marketplace →</Link>{user.role==="admin"&&<Link className="account-secondary" href="/admin/delivery-pricing">Delivery pricing admin</Link>}<button className="account-secondary" onClick={signOut} disabled={signingOut}>{signingOut?"Signing out…":"Sign out"}</button></div></div></section>;
}
