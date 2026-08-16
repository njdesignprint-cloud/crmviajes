import { redirect } from "next/navigation";
import { superadminIdentity } from "../../saas-auth";
import { SuperadminDashboard } from "../../superadmin/superadmin-dashboard";
export const dynamic = "force-dynamic";
export default async function Control(){if(!await superadminIdentity())redirect("/admin/");return <SuperadminDashboard/>;}
