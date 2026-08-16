import { env } from "cloudflare:workers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sessionIdentity } from "../saas-auth";
import { BillingActions } from "./billing-actions";
export const dynamic="force-dynamic";
export default async function Account(){
  const user=await sessionIdentity(); if(!user)redirect("/registro/");
  const agency=await env.DB.prepare("SELECT name,status,plan,trial_ends_at,stripe_customer_id FROM agencies WHERE id=?").bind(user.agencyId).first<{name:string;status:string;plan:string;trial_ends_at:string|null;stripe_customer_id:string|null}>();
  return <main className="account-page"><section className="account-card"><p className="landing-kicker"><span/>MI CUENTA</p><h1>{agency?.name}</h1><div className="account-grid"><article><small>ESTADO</small><strong>{agency?.status}</strong></article><article><small>PLAN</small><strong>{agency?.plan}</strong></article><article><small>PRUEBA HASTA</small><strong>{agency?.trial_ends_at?new Date(agency.trial_ends_at).toLocaleDateString("es-US"):"—"}</strong></article></div><BillingActions hasCustomer={Boolean(agency?.stripe_customer_id)}/><Link href="/crm/">← Regresar al CRM</Link></section></main>;
}
