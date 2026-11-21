"use client";

import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import styles from "./AuthForms.module.css";

type Mode="login"|"register";

export function AuthForms({mode}:{mode:Mode}){
  const router=useRouter();
  const registering=mode==="register";
  const [username,setUsername]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [confirmPassword,setConfirmPassword]=useState("");
  const [referralCode,setReferralCode]=useState("");
  const [usernameState,setUsernameState]=useState<"idle"|"checking"|"available"|"taken"|"error">("idle");
  const [usernameMessage,setUsernameMessage]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  const normalizedUsername=useMemo(()=>username.trim().replace(/^@/,"").toLowerCase(),[username]);

  useEffect(()=>{
    if(!registering)return;
    if(normalizedUsername.length<3||normalizedUsername.length>16||/\s|@/.test(normalizedUsername)){
      setUsernameState("idle");
      setUsernameMessage(normalizedUsername?"Use 3–16 characters without spaces or @.":"");
      return;
    }
    setUsernameState("checking");
    setUsernameMessage("Checking availability…");
    const controller=new AbortController();
    const timer=setTimeout(async()=>{
      try{
        const response=await fetch(`/api/backend/auth/username-availability?username=${encodeURIComponent(normalizedUsername)}`,{signal:controller.signal,cache:"no-store"});
        const data=await response.json();
        if(response.ok&&data.isAvailable){
          setUsernameState("available");
          setUsernameMessage("Username is available");
        }else if(response.status===409){
          setUsernameState("taken");
          setUsernameMessage("That username is already taken");
        }else{
          setUsernameState("error");
          setUsernameMessage(data.message||"Could not verify username");
        }
      }catch{
        if(!controller.signal.aborted){
          setUsernameState("error");
          setUsernameMessage("Could not verify username. Check your connection.");
        }
      }
    },550);
    return()=>{clearTimeout(timer);controller.abort();};
  },[normalizedUsername,registering]);

  async function handleSubmit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    setError("");
    if(registering){
      if(usernameState!=="available"){
        setError("Choose a username that has been verified as available.");
        return;
      }
      if(password.length<8){
        setError("Password must contain at least 8 characters.");
        return;
      }
      if(password!==confirmPassword){
        setError("Your passwords do not match.");
        return;
      }
    }
    setLoading(true);
    try{
      const endpoint=registering?"/api/backend/auth/register":"/api/backend/auth/login";
      const payload=registering
        ?{username:normalizedUsername,email:email.trim(),password,confirm_password:confirmPassword,referral_code:referralCode.trim()||undefined}
        :{email:email.trim(),password};
      const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},credentials:"same-origin",cache:"no-store",body:JSON.stringify(payload)});
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.success||!data.result?.id){
        throw new Error(data.message||data.error||"We couldn't complete your request. Please try again.");
      }
      router.replace("/account/dashboard");
      router.refresh();
    }catch(err){
      setError(err instanceof Error?err.message:"Something went wrong. Please try again.");
    }finally{
      setLoading(false);
    }
  }

  return <div className={styles.panel}>
    <div className={styles.heading}>
      <p className={styles.eyebrow}>{registering?"JOIN YOUR COMMUNITY":"WELCOME BACK"}</p>
      <h1>{registering?<>Make room for<br/><em>good things.</em></>:<>Good to see<br/><em>you again.</em></>}</h1>
      <p>{registering?"Create your Kamba account and discover the businesses around you.":"Sign in to continue exploring your Kamba community."}</p>
    </div>
    <form className={styles.form} onSubmit={handleSubmit}>
      {registering&&<div className={styles.field}>
        <label htmlFor="username">Username</label>
        <div className={styles.usernameInput}><span>@</span><input id="username" value={username} onChange={event=>setUsername(event.target.value.replace(/^@/,"").toLowerCase())} autoComplete="username" minLength={3} maxLength={16} required placeholder="yourusername"/></div>
        {usernameMessage&&<small className={styles[usernameState]}>{usernameMessage}</small>}
      </div>}
      <div className={styles.field}>
        <label htmlFor="email">Email address</label>
        <input id="email" type="email" value={email} onChange={event=>setEmail(event.target.value)} autoComplete="email" required placeholder="you@example.com"/>
      </div>
      <div className={styles.field}>
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete={registering?"new-password":"current-password"} minLength={registering?8:1} required placeholder="At least 8 characters"/>
      </div>
      {registering&&<>
        <div className={styles.field}>
          <label htmlFor="confirmPassword">Confirm password</label>
          <input id="confirmPassword" type="password" value={confirmPassword} onChange={event=>setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={8} required placeholder="Enter your password again"/>
        </div>
        <div className={styles.field}>
          <label htmlFor="referral">Referral code <span>Optional</span></label>
          <input id="referral" value={referralCode} onChange={event=>setReferralCode(event.target.value)} autoComplete="off" placeholder="Have a referral code?"/>
        </div>
      </>}
      {error&&<p className={styles.error} role="alert">{error}</p>}
      <button className={styles.submit} type="submit" disabled={loading||(registering&&usernameState!=="available")}>
        {loading?(registering?"Creating account…":"Signing in…"):(registering?"Create account":"Sign in")} <span>→</span>
      </button>
    </form>
    <p className={styles.switch}>{registering?<>Already have an account? <Link href="/account/login">Sign in</Link></>:<>New to Kamba? <Link href="/account/register">Create an account</Link></>}</p>
    <Link className={styles.back} href="/">← Back to marketplace</Link>
  </div>;
}
