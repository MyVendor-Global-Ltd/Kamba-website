"use client";

import {useCallback,useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import styles from "./DeliveryPricingManager.module.css";

type University={id:string;name:string;slug:string;city:string;state:string;timezone:string;opening_time:string;closing_time:string;is_active:boolean};
type Zone={id:string;name:string;slug:string;zone_type:string;is_active:boolean};
type Store={id:string;store_name:string;slug:string;delivery_zone_name:string|null};
type Rule={id:string;origin_zone_name:string;destination_zone_name:string;delivery_mode:string;base_provider_payout_kobo:number;base_buyer_charge_kobo:number;additional_pickup_provider_payout_kobo:number;additional_pickup_buyer_charge_kobo:number;kamba_margin_kobo:number;is_active:boolean};

async function apiRequest<T>(path:string,init:RequestInit={}):Promise<T>{
 const headers=new Headers(init.headers);
 headers.set("Content-Type","application/json");
 headers.set("Accept","application/json");
 const response=await fetch(`/api/backend${path}`,{...init,credentials:"same-origin",cache:"no-store",headers});
 const data=await response.json().catch(()=>({}));
 if(!response.ok||!data.success)throw new Error(data.message||data.error||"The request could not be completed.");
 return data.result as T;
}
function nairaToKobo(value:string){
 const normalized=value.trim().replace(/,/g,"");
 if(!/^\d+(?:\.\d{1,2})?$/.test(normalized))throw new Error("Enter a valid naira amount with up to two decimal places.");
 const [whole,fraction=""]=normalized.split(".");
 const result=Number(whole)*100+Number((fraction+"00").slice(0,2));
 if(!Number.isSafeInteger(result)||result>2147483647)throw new Error("The amount is outside the supported range.");
 return result;
}
function formatKobo(value:number){return new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN"}).format(value/100);}
function shortTime(value:string){return value?.slice(0,5)||"";}

export function DeliveryPricingManager(){
 const router=useRouter();
 const [checking,setChecking]=useState(true);
 const [allowed,setAllowed]=useState(false);
 const [universities,setUniversities]=useState<University[]>([]);
 const [selectedUniversityId,setSelectedUniversityId]=useState("");
 const [zones,setZones]=useState<Zone[]>([]);
 const [stores,setStores]=useState<Store[]>([]);
 const [rules,setRules]=useState<Rule[]>([]);
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);

 const [universityForm,setUniversityForm]=useState({name:"",slug:"",city:"",state:"",timezone:"Africa/Lagos",opening_time:"08:00",closing_time:"18:00"});
 const [schedule,setSchedule]=useState({timezone:"Africa/Lagos",opening_time:"08:00",closing_time:"18:00"});
 const [zoneForm,setZoneForm]=useState({name:"",slug:"",zone_type:"campus",description:""});
 const [storeId,setStoreId]=useState("");
 const [storeZoneId,setStoreZoneId]=useState("");
 const [ruleForm,setRuleForm]=useState({origin_zone_id:"",destination_zone_id:"",delivery_mode:"express",base_provider_payout:"",base_buyer_charge:"",additional_pickup_provider_payout:"0",additional_pickup_buyer_charge:"0",additional_dropoff_provider_payout:"0",additional_dropoff_buyer_charge:"0",kamba_margin:"0"});

 const selectedUniversity=useMemo(()=>universities.find(item=>item.id===selectedUniversityId)||null,[universities,selectedUniversityId]);

 const loadUniversities=useCallback(async()=>{
  const result=await apiRequest<{universities:University[]}>("/delivery/admin/universities");
  setUniversities(result.universities||[]);
  if(result.universities?.length)setSelectedUniversityId(current=>current||result.universities[0].id);
 },[]);

 const loadUniversityData=useCallback(async(id:string)=>{
  const university=universities.find(item=>item.id===id);
  if(!university)return;
  const [zoneResult,ruleResult,storeResult]=await Promise.all([
   apiRequest<{zones:Zone[]}>(`/delivery/admin/universities/${encodeURIComponent(university.slug)}/zones`),
   apiRequest<{pricing_rules:Rule[]}>(`/delivery/admin/pricing-rules?university_id=${encodeURIComponent(id)}`),
   apiRequest<{stores:Store[]}>(`/delivery/admin/stores?university_id=${encodeURIComponent(id)}`)
  ]);
  setZones(zoneResult.zones||[]);
  setRules(ruleResult.pricing_rules||[]);
  setStores(storeResult.stores||[]);
  setStoreId("");
  setSchedule({timezone:university.timezone,opening_time:shortTime(university.opening_time),closing_time:shortTime(university.closing_time)});
  const firstZoneId=zoneResult.zones?.[0]?.id||"";
  const secondZoneId=zoneResult.zones?.[1]?.id||firstZoneId;
  setStoreZoneId(firstZoneId);
  setRuleForm(current=>({...current,origin_zone_id:firstZoneId,destination_zone_id:secondZoneId}));
 },[universities]);

 useEffect(()=>{
  let active=true;
  async function initialize(){
   try{
    let response=await fetch("/api/backend/auth/dashboard",{credentials:"same-origin",cache:"no-store"});
    if(response.status===401){
     const refreshed=await fetch("/api/backend/auth/refresh",{method:"POST",credentials:"same-origin",cache:"no-store"});
     if(refreshed.ok)response=await fetch("/api/backend/auth/dashboard",{credentials:"same-origin",cache:"no-store"});
    }
    const data=await response.json().catch(()=>({}));
    if(!response.ok||!data.success||data.result?.role!=="admin"){
     if(active){setAllowed(false);router.replace("/account/login");}
     return;
    }
    if(active){setAllowed(true);await loadUniversities();}
   }catch(err){if(active)setError(err instanceof Error?err.message:"Unable to load the admin session.");}
   finally{if(active)setChecking(false);}
  }
  initialize();
  return()=>{active=false;};
 },[loadUniversities,router]);

 useEffect(()=>{
  if(allowed&&selectedUniversityId){
   loadUniversityData(selectedUniversityId).catch(err=>setError(err instanceof Error?err.message:"Unable to load university settings."));
  }
 },[allowed,selectedUniversityId,loadUniversityData]);

 async function runAction(action:()=>Promise<void>){
  setBusy(true);setError("");setMessage("");
  try{await action();}
  catch(err){setError(err instanceof Error?err.message:"Something went wrong.");}
  finally{setBusy(false);}
 }

 async function submitUniversity(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  await runAction(async()=>{
   const result=await apiRequest<{university:University}>("/delivery/admin/universities",{method:"POST",body:JSON.stringify(universityForm)});
   setUniversities(current=>[...current,result.university]);
   setSelectedUniversityId(result.university.id);
   setUniversityForm({name:"",slug:"",city:"",state:"",timezone:"Africa/Lagos",opening_time:"08:00",closing_time:"18:00"});
   setMessage("University created. Add its delivery zones next.");
  });
 }

 async function submitSchedule(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!selectedUniversity)return;
  await runAction(async()=>{
   const result=await apiRequest<{university:University}>(`/delivery/admin/universities/${selectedUniversity.id}`,{method:"PATCH",body:JSON.stringify(schedule)});
   setUniversities(current=>current.map(item=>item.id===result.university.id?result.university:item));
   setMessage("University operating hours updated.");
  });
 }

 async function submitZone(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!selectedUniversity)return;
  await runAction(async()=>{
   const result=await apiRequest<{zone:Zone}>(`/delivery/admin/universities/${selectedUniversity.id}/zones`,{method:"POST",body:JSON.stringify(zoneForm)});
   setZones(current=>[...current,result.zone]);
   setStoreZoneId(result.zone.id);
   setRuleForm(current=>({...current,origin_zone_id:current.origin_zone_id||result.zone.id,destination_zone_id:current.destination_zone_id||result.zone.id}));
   setZoneForm({name:"",slug:"",zone_type:"campus",description:""});
   setMessage("Delivery zone created.");
  });
 }

 async function assignStore(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!selectedUniversity) return;
  await runAction(async()=>{
   await apiRequest(`/delivery/admin/stores/${encodeURIComponent(storeId.trim())}/delivery-location`,{method:"PATCH",body:JSON.stringify({university_id:selectedUniversity.id,zone_id:storeZoneId})});
   await loadUniversityData(selectedUniversity.id);
   setMessage("Store delivery coverage assigned.");
  });
 }

 async function submitRule(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(!selectedUniversity)return;
  await runAction(async()=>{
   const body={
    university_id:selectedUniversity.id,
    origin_zone_id:ruleForm.origin_zone_id,
    destination_zone_id:ruleForm.destination_zone_id,
    delivery_mode:ruleForm.delivery_mode,
    base_provider_payout_kobo:nairaToKobo(ruleForm.base_provider_payout),
    base_buyer_charge_kobo:nairaToKobo(ruleForm.base_buyer_charge),
    additional_pickup_provider_payout_kobo:nairaToKobo(ruleForm.additional_pickup_provider_payout),
    additional_pickup_buyer_charge_kobo:nairaToKobo(ruleForm.additional_pickup_buyer_charge),
    additional_dropoff_provider_payout_kobo:nairaToKobo(ruleForm.additional_dropoff_provider_payout),
    additional_dropoff_buyer_charge_kobo:nairaToKobo(ruleForm.additional_dropoff_buyer_charge),
    kamba_margin_kobo:nairaToKobo(ruleForm.kamba_margin),
    currency:"NGN",
   };
   await apiRequest("/delivery/admin/pricing-rules",{method:"POST",body:JSON.stringify(body)});
   const refreshed=await apiRequest<{pricing_rules:Rule[]}>(`/delivery/admin/pricing-rules?university_id=${selectedUniversity.id}`);
   setRules(refreshed.pricing_rules||[]);
   setMessage("Route pricing rule saved. New delivery quotes will use this configuration.");
  });
 }

 if(checking)return <section className={styles.page}><div className={styles.loading}>Checking administrator access…</div></section>;
 if(!allowed)return <section className={styles.page}><div className={styles.loading}>Administrator access required. <Link href="/account/login">Sign in</Link></div></section>;

 return <section className={styles.page}>
  <div className={styles.topline}><div><p className={styles.eyebrow}>KAMBA OPERATIONS</p><h1>Delivery <em>pricing.</em></h1><p className={styles.intro}>Configure university coverage, local operating hours and negotiated route prices. All amounts entered below are in naira; the API stores kobo.</p></div><Link href="/account/dashboard" className={styles.back}>← Account</Link></div>
  {error&&<div className={styles.alert} role="alert">{error}</div>}
  {message&&<div className={styles.notice} role="status">{message}</div>}

  <div className={styles.layout}>
   <aside className={styles.sidebar}>
    <div className={styles.card}>
     <div className={styles.cardHead}><span>01 / LOCATION</span><strong>Universities</strong></div>
     <label className={styles.label} htmlFor="universitySelect">Active configuration</label>
     <select id="universitySelect" value={selectedUniversityId} onChange={event=>setSelectedUniversityId(event.target.value)}>
      <option value="">Select a university</option>
      {universities.map(item=><option key={item.id} value={item.id}>{item.name} — {item.city}</option>)}
     </select>
     {selectedUniversity&&<p className={styles.meta}>{selectedUniversity.state}, {selectedUniversity.city}<br/>{selectedUniversity.slug}</p>}
    </div>
    <form className={styles.card} onSubmit={submitUniversity}>
     <div className={styles.cardHead}><span>NEW LOCATION</span><strong>Add university</strong></div>
     <label className={styles.label}>University name<input required value={universityForm.name} onChange={e=>setUniversityForm({...universityForm,name:e.target.value})} placeholder="e.g. University of Ibadan"/></label>
     <label className={styles.label}>URL slug<input value={universityForm.slug} onChange={e=>setUniversityForm({...universityForm,slug:e.target.value.toLowerCase()})} placeholder="university-of-ibadan"/></label>
     <div className={styles.two}><label className={styles.label}>City<input required value={universityForm.city} onChange={e=>setUniversityForm({...universityForm,city:e.target.value})}/></label><label className={styles.label}>State<input required value={universityForm.state} onChange={e=>setUniversityForm({...universityForm,state:e.target.value})}/></label></div>
     <label className={styles.label}>Time zone<input required value={universityForm.timezone} onChange={e=>setUniversityForm({...universityForm,timezone:e.target.value})}/></label>
     <div className={styles.two}><label className={styles.label}>Opens<input type="time" required value={universityForm.opening_time} onChange={e=>setUniversityForm({...universityForm,opening_time:e.target.value})}/></label><label className={styles.label}>Closes<input type="time" required value={universityForm.closing_time} onChange={e=>setUniversityForm({...universityForm,closing_time:e.target.value})}/></label></div>
     <button className={styles.primary} disabled={busy}>Create university <span>→</span></button>
    </form>
   </aside>

   <div className={styles.main}>
    {selectedUniversity?<>
     <form className={styles.card} onSubmit={submitSchedule}>
      <div className={styles.cardHead}><span>02 / OPERATIONS</span><strong>Operating window</strong></div>
      <p className={styles.cardText}>New delivery orders and dispatch offers are accepted only inside this university's operating window. Already accepted jobs can continue after closing.</p>
      <div className={styles.scheduleGrid}>
       <label className={styles.label}>Time zone<input required value={schedule.timezone} onChange={e=>setSchedule({...schedule,timezone:e.target.value})}/></label>
       <label className={styles.label}>Opening time<input type="time" required value={schedule.opening_time} onChange={e=>setSchedule({...schedule,opening_time:e.target.value})}/></label>
       <label className={styles.label}>Closing time<input type="time" required value={schedule.closing_time} onChange={e=>setSchedule({...schedule,closing_time:e.target.value})}/></label>
      </div>
      <button className={styles.secondary} disabled={busy}>Save operating hours</button>
     </form>

     <form className={styles.card} onSubmit={submitZone}>
      <div className={styles.cardHead}><span>03 / COVERAGE</span><strong>Delivery zones</strong></div>
      <div className={styles.zoneList}>{zones.map(zone=><span key={zone.id} className={styles.zone}>{zone.name}<small>{zone.zone_type}</small></span>)}{!zones.length&&<p className={styles.empty}>No zones configured yet.</p>}</div>
      <div className={styles.two}><label className={styles.label}>Zone name<input required value={zoneForm.name} onChange={e=>setZoneForm({...zoneForm,name:e.target.value})} placeholder="Student Hostels"/></label><label className={styles.label}>Slug<input value={zoneForm.slug} onChange={e=>setZoneForm({...zoneForm,slug:e.target.value.toLowerCase()})} placeholder="student-hostels"/></label></div>
      <div className={styles.two}><label className={styles.label}>Zone type<select value={zoneForm.zone_type} onChange={e=>setZoneForm({...zoneForm,zone_type:e.target.value})}><option value="campus">Campus</option><option value="residential">Residential</option><option value="commercial">Commercial</option><option value="neighbourhood">Neighbourhood</option><option value="other">Other</option></select></label><label className={styles.label}>Description<input value={zoneForm.description} onChange={e=>setZoneForm({...zoneForm,description:e.target.value})} placeholder="Optional coverage note"/></label></div>
      <button className={styles.secondary} disabled={busy}>Add zone</button>
     </form>

     <form className={styles.card} onSubmit={assignStore}>
      <div className={styles.cardHead}><span>04 / VENDOR COVERAGE</span><strong>Assign a store</strong></div>
      <p className={styles.cardText}>Every store needs an origin zone before Kamba can quote delivery from it. Only active stores that are unassigned or already belong to this university are listed.</p>
      <div className={styles.two}><label className={styles.label}>Store<select required value={storeId} onChange={e=>setStoreId(e.target.value)}><option value="">Choose a store</option>{stores.map(store=><option key={store.id} value={store.id}>{store.store_name} {store.delivery_zone_name?(`· ${store.delivery_zone_name}`):"· Unassigned"}</option>)}</select></label><label className={styles.label}>Pickup zone<select required value={storeZoneId} onChange={e=>setStoreZoneId(e.target.value)}><option value="">Choose zone</option>{zones.map(zone=><option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label></div>
      <button className={styles.secondary} disabled={busy||!zones.length||!storeId}>Assign store location</button>
     </form>

     <form className={styles.card} onSubmit={submitRule}>
      <div className={styles.cardHead}><span>05 / ROUTE ECONOMICS</span><strong>Configure a delivery price</strong></div>
      <p className={styles.cardText}>Set what the provider earns separately from what the buyer pays. The Kamba delivery margin is recorded separately. The first pickup and first drop-off are included in the base price.</p>
      <div className={styles.two}><label className={styles.label}>Pickup zone<select required value={ruleForm.origin_zone_id} onChange={e=>setRuleForm({...ruleForm,origin_zone_id:e.target.value})}><option value="">Select origin</option>{zones.map(zone=><option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label><label className={styles.label}>Destination zone<select required value={ruleForm.destination_zone_id} onChange={e=>setRuleForm({...ruleForm,destination_zone_id:e.target.value})}><option value="">Select destination</option>{zones.map(zone=><option key={zone.id} value={zone.id}>{zone.name}</option>)}</select></label></div>
      <label className={styles.label}>Delivery mode<select value={ruleForm.delivery_mode} onChange={e=>setRuleForm({...ruleForm,delivery_mode:e.target.value})}><option value="express">Express</option><option value="batch">Batch (configuration only — dispatch not enabled)</option></select></label>
      <div className={styles.priceGrid}>
       <label className={styles.label}>Provider base payout (₦)<input inputMode="decimal" required value={ruleForm.base_provider_payout} onChange={e=>setRuleForm({...ruleForm,base_provider_payout:e.target.value})} placeholder="1000"/></label>
       <label className={styles.label}>Buyer base delivery charge (₦)<input inputMode="decimal" required value={ruleForm.base_buyer_charge} onChange={e=>setRuleForm({...ruleForm,base_buyer_charge:e.target.value})} placeholder="1000"/></label>
       <label className={styles.label}>Provider / extra pickup (₦)<input inputMode="decimal" value={ruleForm.additional_pickup_provider_payout} onChange={e=>setRuleForm({...ruleForm,additional_pickup_provider_payout:e.target.value})} placeholder="200"/></label>
       <label className={styles.label}>Buyer / extra pickup (₦)<input inputMode="decimal" value={ruleForm.additional_pickup_buyer_charge} onChange={e=>setRuleForm({...ruleForm,additional_pickup_buyer_charge:e.target.value})} placeholder="200"/></label>
       <label className={styles.label}>Provider / extra drop-off (₦)<input inputMode="decimal" value={ruleForm.additional_dropoff_provider_payout} onChange={e=>setRuleForm({...ruleForm,additional_dropoff_provider_payout:e.target.value})} placeholder="0"/></label>
       <label className={styles.label}>Buyer / extra drop-off (₦)<input inputMode="decimal" value={ruleForm.additional_dropoff_buyer_charge} onChange={e=>setRuleForm({...ruleForm,additional_dropoff_buyer_charge:e.target.value})} placeholder="0"/></label>
       <label className={styles.label}>Kamba delivery margin (₦)<input inputMode="decimal" value={ruleForm.kamba_margin} onChange={e=>setRuleForm({...ruleForm,kamba_margin:e.target.value})} placeholder="200"/></label>
      </div>
      <button className={styles.primary} disabled={busy||zones.length<2}>Save route pricing <span>→</span></button>
     </form>

     <div className={styles.card}>
      <div className={styles.cardHead}><span>06 / ACTIVE CONFIGURATION</span><strong>Configured routes</strong></div>
      {rules.length?<div className={styles.ruleList}>{rules.map(rule=><div className={styles.rule} key={rule.id}><div><strong>{rule.origin_zone_name} <span>→</span> {rule.destination_zone_name}</strong><small>{rule.delivery_mode} · {rule.is_active?"Active":"Disabled"}</small></div><div className={styles.rulePrices}><span>Provider {formatKobo(rule.base_provider_payout_kobo)}</span><span>Buyer {formatKobo(rule.base_buyer_charge_kobo+rule.kamba_margin_kobo)}</span></div></div>)}</div>:<p className={styles.empty}>No route pricing has been configured for this university.</p>}
     </div>
    </>:<div className={styles.card}><p className={styles.empty}>Create or select a university to configure its delivery zones and prices.</p></div>}
   </div>
  </div>
  <p className={styles.footnote}>All pricing is stored in kobo. Changes apply to new quotes only; existing orders keep their original pricing snapshot. Batch checkout remains disabled until compatible orders are grouped into a shared trip.</p>
 </section>;
}
