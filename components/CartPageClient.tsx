"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import styles from "./Commerce.module.css";
import {naira} from "@/lib/api";
type Item={product_id:string;name:string;quantity:number;price:number;line_total:number;store_name?:string;available?:boolean};
type Cart={items:Item[];subtotal:number;currency:string};
async function request(path:string,init?:RequestInit){const response=await fetch("/api/backend"+path,{credentials:"same-origin",cache:"no-store",...init});const data=await response.json().catch(()=>({}));if(!response.ok||data.success===false)throw new Error(data.message||"Kamba could not complete that request.");return data;}
export function CartPageClient(){
 const [cart,setCart]=useState<Cart>({items:[],subtotal:0,currency:"NGN"});const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const load=useCallback(async()=>{setLoading(true);setError("");try{const data=await request("/commerce/cart");setCart({items:data.items||[],subtotal:data.subtotal||0,currency:data.currency||"NGN"});}catch(e){setError(e instanceof Error?e.message:"Unable to load your cart.");}finally{setLoading(false);}},[]);
 useEffect(()=>{load();},[load]);
 async function change(item:Item,quantity:number){try{if(quantity<1)await request("/commerce/cart/items/"+encodeURIComponent(item.product_id),{method:"DELETE"});else await request("/commerce/cart/items/"+encodeURIComponent(item.product_id),{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({quantity})});await load();}catch(e){setError(e instanceof Error?e.message:"Could not update your cart.");}}
 if(loading)return <section className={styles.page}><p className={styles.muted}>Loading your cart…</p></section>;
 return <section className={styles.page}><div className={styles.heading}><div><p className="eyebrow">YOUR BAG</p><h1>Shopping cart<span>.</span></h1><p className={styles.muted}>Review your items before checking out.</p></div><Link className="account-secondary" href="/products">Continue shopping</Link></div>
 {error&&<p className={styles.error} role="alert">{error}</p>}
 {!cart.items.length?<div className={styles.empty}><h2>Your cart is empty.</h2><p>Find something useful from a shop around your campus.</p><Link className="button" href="/products">Explore products →</Link></div>:<div className={styles.layout}><div className={styles.panel}>{cart.items.map(item=><div className={styles.item} key={item.product_id}><div><h3>{item.name}</h3><small>{item.store_name||"Kamba store"}{item.available===false?" · Currently unavailable":""}</small><div className={styles.controls}><button onClick={()=>change(item,item.quantity-1)} aria-label={"Decrease "+item.name}>−</button><span className={styles.qty}>{item.quantity}</span><button onClick={()=>change(item,item.quantity+1)} aria-label={"Increase "+item.name}>+</button><button className={styles.secondary} onClick={()=>change(item,0)}>Remove</button></div></div><strong className={styles.price}>{naira(item.line_total)}</strong></div>)}</div><aside className={styles.panel}><h2>Order summary</h2><div className={styles.summaryRow}><span>Subtotal</span><strong>{naira(cart.subtotal)}</strong></div><p className={styles.note}>The platform charge and delivery price are calculated by Kamba at checkout. The current cart supports products from one store per order.</p><Link className={"button "+styles.full} href="/checkout">Continue to checkout →</Link></aside></div>}</section>;
}
