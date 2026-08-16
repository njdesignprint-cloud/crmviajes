import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
export const dynamic="force-dynamic";
function hex(buffer:ArrayBuffer){return [...new Uint8Array(buffer)].map(v=>v.toString(16).padStart(2,"0")).join("");}
function safeEqual(a:string,b:string){if(a.length!==b.length)return false;let out=0;for(let i=0;i<a.length;i++)out|=a.charCodeAt(i)^b.charCodeAt(i);return out===0;}
export async function POST(request:Request){
  const secret=(env as {STRIPE_WEBHOOK_SECRET?:string}).STRIPE_WEBHOOK_SECRET; if(!secret)return NextResponse.json({error:"Webhook no configurado."},{status:503});
  const raw=await request.text(); const signature=request.headers.get("stripe-signature")||""; const timestamp=signature.match(/(?:^|,)t=([^,]+)/)?.[1]; const candidates=[...signature.matchAll(/(?:^|,)v1=([^,]+)/g)].map(m=>m[1]);
  if(!timestamp||Math.abs(Date.now()/1000-Number(timestamp))>300)return NextResponse.json({error:"Firma vencida."},{status:400});
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]); const expected=hex(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(`${timestamp}.${raw}`)));
  if(!candidates.some(candidate=>safeEqual(candidate,expected)))return NextResponse.json({error:"Firma inválida."},{status:400});
  const event=JSON.parse(raw) as {id:string;type:string;data:{object:Record<string,unknown>}}; const object=event.data.object; const agencyId=Number((object.metadata as Record<string,string>|undefined)?.agency_id||(object.client_reference_id as string)||0)||null;
  try{await env.DB.prepare("INSERT INTO billing_events (provider_event_id,event_type,agency_id,payload_json,created_at) VALUES (?,?,?,?,?)").bind(event.id,event.type,agencyId,raw.slice(0,100000),new Date().toISOString()).run();}catch{return NextResponse.json({received:true,duplicate:true});}
  if(agencyId&&event.type==="checkout.session.completed")await env.DB.prepare("UPDATE agencies SET status='active',plan=CASE WHEN plan='trial' THEN 'basic' ELSE plan END,stripe_customer_id=COALESCE(?,stripe_customer_id),stripe_subscription_id=COALESCE(?,stripe_subscription_id),updated_at=? WHERE id=?").bind(String(object.customer||""),String(object.subscription||""),new Date().toISOString(),agencyId).run();
  if(event.type==="customer.subscription.deleted")await env.DB.prepare("UPDATE agencies SET status='expired',updated_at=? WHERE stripe_subscription_id=?").bind(new Date().toISOString(),String(object.id||"")).run();
  return NextResponse.json({received:true});
}
