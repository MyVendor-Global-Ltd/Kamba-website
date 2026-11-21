"use client";
import {useState} from "react";
import Link from "next/link";
export function AddToCart({productId}:{productId:string}){
 const [loading,setLoading]=useState(false);const [message,setMessage]=useState("");const [added,setAdded]=useState(false);
 async function add(){setLoading(true);setMessage("");setAdded(false);try{const response=await fetch("/api/backend/commerce/cart/items",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({product_id:productId,quantity:1})});const data=await response.json().catch(()=>({}));if(response.status===401){setMessage("Sign in to add products to your cart.");return;}if(!response.ok||data.success===false)throw new Error(data.message||"Could not add this product.");setAdded(true);setMessage("Added to your cart.");}catch(error){setMessage(error instanceof Error?error.message:"Could not add this product.");}finally{setLoading(false);}}
 return <div className="commerce-add"><button className="button" onClick={add} disabled={loading}>{loading?"Adding…":added?"Add another":"Add to cart →"}</button>{message&&<p className="commerce-feedback" role="status">{message} {added&&<Link href="/cart">View cart</Link>}</p>}</div>;
}
