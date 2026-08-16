import { redirect } from "next/navigation";
import { CrmDashboard } from "../crm-dashboard";
import { sessionIdentity } from "../saas-auth";
export const dynamic = "force-dynamic";
export default async function CustomerApp(){ if(!await sessionIdentity()) redirect("/registro/"); return <CrmDashboard/>; }
