import type {NextRequest} from "next/server";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function apiBaseUrl(){
  const configured=(process.env.KAMBA_API_URL||process.env.NEXT_PUBLIC_API_URL||"https://api.kamba.ng").replace(/\/+$/,"");
  if(configured.endsWith("/api/v1"))return configured;
  if(configured.endsWith("/api"))return configured+"/v1";
  if(configured.endsWith("/v1"))return configured.slice(0,-3)+"/api/v1";
  return configured+"/api/v1";
}

async function proxy(request:NextRequest,context:{params:Promise<{path:string[]}>}){
  const method=request.method.toUpperCase();
  const url=new URL(request.url);
  const origin=request.headers.get("origin");
  if(!["GET","HEAD"].includes(method)&&origin&&origin!==url.origin){
    return Response.json({success:false,message:"Cross-origin request rejected."},{status:403});
  }

  const {path=[]}=await context.params;
  if(!path.length||path.some(segment=>!segment||segment==="."||segment===".."||!/^[A-Za-z0-9._~-]+$/.test(segment))){
    return Response.json({success:false,message:"Invalid API path."},{status:400});
  }

  const upstreamUrl=`${apiBaseUrl()}/${path.map(encodeURIComponent).join("/")}${url.search}`;
  const headers=new Headers({Accept:"application/json"});
  const cookie=request.headers.get("cookie");
  const contentType=request.headers.get("content-type");
  const idempotencyKey=request.headers.get("idempotency-key");
  if(cookie)headers.set("cookie",cookie);
  if(contentType)headers.set("content-type",contentType);
  if(idempotencyKey)headers.set("idempotency-key",idempotencyKey);

  try{
    const body=["GET","HEAD"].includes(method)?undefined:await request.arrayBuffer();
    const upstream=await fetch(upstreamUrl,{method,headers,body,cache:"no-store",redirect:"manual"});
    const responseHeaders=new Headers();
    const upstreamContentType=upstream.headers.get("content-type");
    if(upstreamContentType)responseHeaders.set("content-type",upstreamContentType);
    responseHeaders.set("cache-control","no-store");

    const cookieHeaders=(upstream.headers as Headers&{getSetCookie?:()=>string[]}).getSetCookie?.()??[];
    const fallbackCookie=upstream.headers.get("set-cookie");
    const cookies=cookieHeaders.length?cookieHeaders:(fallbackCookie?[fallbackCookie]:[]);
    for(const value of cookies){
      responseHeaders.append("set-cookie",value.replace(/;\s*Domain=[^;]*/i,""));
    }

    const responseBody=method==="HEAD"?null:await upstream.arrayBuffer();
    return new Response(responseBody,{status:upstream.status,headers:responseHeaders});
  }catch{
    return Response.json({success:false,message:"Kamba is temporarily unavailable. Please try again."},{status:503});
  }
}

export const GET=proxy;
export const POST=proxy;
export const PUT=proxy;
export const PATCH=proxy;
export const DELETE=proxy;
