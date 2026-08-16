import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { sessionIdentity } from "../../saas-auth";
export const dynamic="force-dynamic";

async function stripe(path:string, values:Record<string,string>) {
  const secret=(env as {STRIPE_SECRET_KEY?:string}).STRIPE_SECRET_KEY;
  if(!secret) throw new Error("Los cobros están preparados, pero Stripe todavía no está configurado.");
  const response=await fetch(`https://api.stripe.com/v1/${path}`,{method:"POST",headers:{authorization:`Bearer ${secret}`,"content-type":"application/x-www-form-urlencoded"},body:new URLSearchParams(values)});
  const data=await response.json() as {url?:string;error?:{message?:string}};
  if(!response.ok||!data.url) throw new Error(data.error?.message||"Stripe no pudo crear la sesión.");
  return data.url;
}
export async function POST(request:Request){
  try{
    const user=await sessionIdentity(); if(!user) return NextResponse.json({error:"Inicia sesión."},{status:401});
    const body=await request.json() as {action?:string;plan?:string}; const origin=new URL(request.url).origin;
    const agency=await env.DB.prepare("SELECT stripe_customer_id FROM agencies WHERE id=?").bind(user.agencyId).first<{stripe_customer_id:string|null}>();
    if(body.action==="checkout"){
      const config=env as {STRIPE_PRICE_BASIC?:string;STRIPE_PRICE_PRO?:string};
      const price=body.plan==="pro"?config.STRIPE_PRICE_PRO:config.STRIPE_PRICE_BASIC;
      if(!price) throw new Error("Los precios de Stripe todavía no están configurados.");
      const values:Record<string,string>={
        mode:"subscription",
        "line_items[0][price]":price,
        "line_items[0][quantity]":"1",
        success_url:`${origin}/mi-cuenta/?payment=success`,
        cancel_url:`${origin}/mi-cuenta/?payment=cancelled`,
        client_reference_id:String(user.agencyId),
        "metadata[agency_id]":String(user.agencyId),
      };
      if(agency?.stripe_customer_id) values.customer=agency.stripe_customer_id; else values.customer_email=user.email;
      return NextResponse.json({url:await stripe("checkout/sessions",values)});
    }
    if(body.action==="portal"){
      if(!agency?.stripe_customer_id) throw new Error("Esta cuenta todavía no tiene una suscripción.");
      return NextResponse.json({url:await stripe("billing_portal/sessions",{customer:agency.stripe_customer_id,return_url:`${origin}/mi-cuenta/`})});
    }
    throw new Error("Acción no válida.");
  }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"No se pudo iniciar el cobro."},{status:400});}
}
