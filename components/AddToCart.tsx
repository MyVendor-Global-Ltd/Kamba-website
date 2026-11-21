"use client";
import {useState} from "react";
import Link from "next/link";
import styles from "./Commerce.module.css";
export function AddToCart({productId}:{productId:string}){
 const [loading,setLoading]=useState(false);const [message,setMessage]=useState("");const [added,setAdded]=useState(false);const [authRequired,setAuthRequired]=useState(false);
 async function add(){setLoading(true);setMessage("");setAdded(false);setAuthRequired(false);try{const response=await fetch("/api/backend/commerce/cart/items",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({product_id:productId,quantity:1})});const data=await response.json().catch(()=>({}));if(response.status===401){setAuthRequired(true);setMessage("Sign in to add products to your cart.");return;}if(!response.ok||data.success===false)throw new Error(data.message||"Could not add this product.");setAdded(true);setMessage("Added to your cart.");}catch(error){setMessage(error instanceof Error?error.message:"Could not add this product.");}finally{setLoading(false);}}
 return <div className={styles.add}><button className="button" onClick={add} disabled={loading}>{loading?"Adding…":added?"Add another":"Add to cart →"}</button>{message&&<p className={styles.feedback} role="status">{message} {added&&<Link href="/cart">View cart</Link>}{authRequired&&<Link href="/account/login">Sign in</Link>}</p>}</div>;
}
