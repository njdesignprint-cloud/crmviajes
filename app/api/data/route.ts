import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
import { isAuthError, requireAgencyContext } from "../../server-auth";
import { hashPublicToken, randomPublicToken } from "../../token-utils";
export const dynamic = "force-dynamic";

type Body = Record<string, string | number | boolean | null>;

class InputError extends Error {}

function text(body: Body, field: string, max = 500, optional = false) {
  const value = typeof body[field] === "string" ? body[field].trim() : "";
  if (!value && !optional) throw new InputError(`Falta el campo ${field}.`);
  if (value.length > max) throw new InputError(`${field} es demasiado largo.`);
  return value;
}

function id(body: Body, field: string) {
  const value = Number(body[field]);
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new InputError(`${field} no es válido.`);
  return value;
}

function amount(body: Body, field: string) {
  const value = Number(body[field]);
  if (!Number.isFinite(value) || value < 0 || value > 100_000_000)
    throw new InputError(`${field} no es un importe válido.`);
  return Math.round(value * 100) / 100;
}

function date(body: Body, field: string) {
  const value = text(body, field, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`)))
    throw new InputError(`${field} no es una fecha válida.`);
  return value;
}

function choice(body: Body, field: string, allowed: readonly string[], fallback?: string) {
  const value = typeof body[field] === "string" ? body[field] : fallback;
  if (!value || !allowed.includes(value)) throw new InputError(`${field} no es válido.`);
  return value;
}

type QuoteItemInput = { category: string; description: string; quantity: number; unitPrice: number };
function quoteItems(body: Body): QuoteItemInput[] {
  if (typeof body.items !== "string") throw new InputError("Agrega al menos una partida.");
  let raw: unknown;
  try { raw = JSON.parse(body.items); } catch { throw new InputError("Las partidas no son válidas."); }
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 50) throw new InputError("La cotización debe tener entre 1 y 50 partidas.");
  return raw.map((entry, index) => {
    if (!entry || typeof entry !== "object") throw new InputError(`La partida ${index + 1} no es válida.`);
    const item = entry as Record<string, unknown>;
    const category = String(item.category || "Otro").trim();
    const description = String(item.description || "").trim();
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    if (!description || description.length > 200) throw new InputError(`Revisa la descripción de la partida ${index + 1}.`);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) throw new InputError(`Revisa la cantidad de la partida ${index + 1}.`);
    if (!Number.isFinite(unitPrice) || unitPrice < 0 || unitPrice > 100_000_000) throw new InputError(`Revisa el precio de la partida ${index + 1}.`);
    return { category: category.slice(0, 40), description, quantity, unitPrice: Math.round(unitPrice * 100) / 100 };
  });
}

export async function GET() {
  const context = await requireAgencyContext();
  if (isAuthError(context)) return context;
  const db=env.DB, agencyId=context.agencyId;
  const [clients,trips,payments,tasks,quotes,activities,travelers,suppliers,bookings,members]=await Promise.all([
    db.prepare("SELECT * FROM clients WHERE agency_id=? AND archived_at IS NULL ORDER BY id DESC").bind(agencyId).all(),
    db.prepare("SELECT t.*,c.name AS client_name FROM trips t JOIN clients c ON c.id=t.client_id AND c.agency_id=t.agency_id WHERE t.agency_id=? ORDER BY t.start_date").bind(agencyId).all(),
    db.prepare("SELECT p.*,t.destination,c.name AS client_name FROM payments p JOIN trips t ON t.id=p.trip_id AND t.agency_id=p.agency_id JOIN clients c ON c.id=t.client_id AND c.agency_id=p.agency_id WHERE p.agency_id=? ORDER BY p.due_date").bind(agencyId).all(),
    db.prepare("SELECT t.*,c.name AS client_name FROM tasks t LEFT JOIN clients c ON c.id=t.client_id AND c.agency_id=t.agency_id WHERE t.agency_id=? ORDER BY t.completed,t.due_date").bind(agencyId).all(),
    db.prepare("SELECT q.*,c.name AS client_name,(SELECT COUNT(*) FROM quote_items qi WHERE qi.quote_id=q.id AND qi.agency_id=q.agency_id) AS item_count FROM quotes q JOIN clients c ON c.id=q.client_id AND c.agency_id=q.agency_id WHERE q.agency_id=? ORDER BY q.id DESC").bind(agencyId).all(),
    db.prepare("SELECT a.*,c.name AS client_name FROM activities a JOIN clients c ON c.id=a.client_id AND c.agency_id=a.agency_id WHERE a.agency_id=? ORDER BY a.id DESC LIMIT 30").bind(agencyId).all(),
    db.prepare("SELECT v.*,c.name AS client_name FROM travelers v JOIN clients c ON c.id=v.client_id AND c.agency_id=v.agency_id WHERE v.agency_id=? ORDER BY v.last_name,v.first_name").bind(agencyId).all(),
    db.prepare("SELECT * FROM suppliers WHERE agency_id=? ORDER BY name").bind(agencyId).all(),
    db.prepare("SELECT b.*,t.destination,c.name AS client_name,s.name AS supplier_name FROM bookings b JOIN trips t ON t.id=b.trip_id AND t.agency_id=b.agency_id JOIN clients c ON c.id=t.client_id AND c.agency_id=b.agency_id JOIN suppliers s ON s.id=b.supplier_id AND s.agency_id=b.agency_id WHERE b.agency_id=? ORDER BY b.id DESC").bind(agencyId).all(),
    context.role==="owner"||context.role==="admin" ? db.prepare("SELECT id,email,display_name,role,active,created_at FROM agency_members WHERE agency_id=? ORDER BY active DESC,display_name,email").bind(agencyId).all() : Promise.resolve({results:[]}),
  ]);
  return NextResponse.json({clients:clients.results,trips:trips.results,payments:payments.results,tasks:tasks.results,quotes:quotes.results,activities:activities.results,travelers:travelers.results,suppliers:suppliers.results,bookings:bookings.results,members:members.results,user:{email:context.email,displayName:context.displayName,role:context.role}});
}

export async function POST(request:Request) {
  const contentLength=Number(request.headers.get("content-length")||0);
  if(contentLength>100_000) return NextResponse.json({error:"La solicitud es demasiado grande."},{status:413});
  const context = await requireAgencyContext();
  if (isAuthError(context)) return context;
  if (context.role === "viewer") return NextResponse.json({error:"Tu rol es de solo lectura."},{status:403});
  try {
    const body = await request.json() as Body;
    const db=env.DB;
    const agencyId=context.agencyId;
    let responseData: Record<string, unknown> = {};
    const today=new Date().toISOString().slice(0,10);
    if(body.action==="client") {
      const email = text(body,"email",254,true);
      if (email && !/^\S+@\S+\.\S+$/.test(email)) throw new InputError("El email no es válido.");
      const result=await db.prepare("INSERT INTO clients (agency_id,name,email,phone,destination,status,created_at) VALUES (?,?,?,?,?,?,?)").bind(agencyId,text(body,"name",120),email,text(body,"phone",40,true),text(body,"destination",120,true)||"Por definir",choice(body,"status",["Nuevo","Cotización","Apartado","Confirmado"],"Nuevo"),today).run();
      await db.prepare("INSERT INTO activities (agency_id,client_id,kind,detail,created_at) VALUES (?,?,?,?,?)").bind(agencyId,result.meta.last_row_id,"Cliente",`Expediente creado por ${context.email}`,today).run();
    }
    else if(body.action==="editClient") {
      const email=text(body,"email",254,true); if(email&&!/^\S+@\S+\.\S+$/.test(email)) throw new InputError("El email no es válido.");
      const result=await db.prepare("UPDATE clients SET name=?,email=?,phone=?,destination=?,status=? WHERE id=? AND agency_id=? AND archived_at IS NULL").bind(text(body,"name",120),email,text(body,"phone",40,true),text(body,"destination",120,true)||"Por definir",choice(body,"status",["Nuevo","Cotización","Apartado","Confirmado"]),id(body,"clientId"),agencyId).run();
      if(!result.meta.changes) throw new InputError("No se encontró el cliente.");
    }
    else if(body.action==="archiveClient") {
      const result=await db.prepare("UPDATE clients SET archived_at=? WHERE id=? AND agency_id=? AND archived_at IS NULL").bind(new Date().toISOString(),id(body,"id"),agencyId).run();
      if(!result.meta.changes) throw new InputError("No se encontró el cliente.");
    }
    else if(body.action==="trip") {
      const start=date(body,"startDate"), end=date(body,"endDate");
      if(end < start) throw new InputError("La fecha final no puede ser anterior al inicio.");
      await db.prepare("INSERT INTO trips (agency_id,client_id,destination,start_date,end_date,total,status) SELECT ?,id,?,?,?,?,? FROM clients WHERE id=? AND agency_id=?").bind(agencyId,text(body,"destination",120),start,end,amount(body,"total"),"Confirmado",id(body,"clientId"),agencyId).run();
    }
    else if(body.action==="quote") {
      const items=quoteItems(body), subtotal=Math.round(items.reduce((sum,item)=>sum+item.quantity*item.unitPrice,0)*100)/100, taxes=amount(body,"taxes");
      const clientId=id(body,"clientId");
      const client=await db.prepare("SELECT id FROM clients WHERE id=? AND agency_id=?").bind(clientId,agencyId).first();
      if(!client) throw new InputError("El cliente no pertenece a esta agencia.");
      const result=await db.prepare("INSERT INTO quotes (agency_id,client_id,destination,travelers,subtotal,taxes,total,status,valid_until,created_at,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)").bind(agencyId,clientId,text(body,"destination",120),id(body,"travelers"),subtotal,taxes,subtotal+taxes,"Borrador",date(body,"validUntil"),today,text(body,"notes",2000,true)).run();
      const quoteId=Number(result.meta.last_row_id);
      await db.batch(items.map((item,index)=>db.prepare("INSERT INTO quote_items (agency_id,quote_id,category,description,quantity,unit_price,total,sort_order) VALUES (?,?,?,?,?,?,?,?)").bind(agencyId,quoteId,item.category,item.description,item.quantity,item.unitPrice,Math.round(item.quantity*item.unitPrice*100)/100,index)));
    }
    else if(body.action==="quoteStatus") await db.prepare("UPDATE quotes SET status=? WHERE id=? AND agency_id=?").bind(choice(body,"status",["Borrador","Enviada","Aceptada","Rechazada"]),id(body,"id"),agencyId).run();
    else if(body.action==="shareQuote") {
      const quoteId=id(body,"id"), token=randomPublicToken(), tokenHash=await hashPublicToken(token);
      const result=await db.prepare("UPDATE quotes SET share_token_hash=?,status=CASE WHEN status='Borrador' THEN 'Enviada' ELSE status END WHERE id=? AND agency_id=?").bind(tokenHash,quoteId,agencyId).run();
      if(!result.meta.changes) throw new InputError("No se encontró la cotización.");
      responseData={path:`/proposal/${token}`};
    }
    else if(body.action==="convertQuote") {
      const quoteId=id(body,"quoteId"), start=date(body,"startDate"), end=date(body,"endDate");
      if(end<start) throw new InputError("La fecha final no puede ser anterior al inicio.");
      const quote=await db.prepare("SELECT id,client_id,destination,total,status,converted_trip_id FROM quotes WHERE id=? AND agency_id=?").bind(quoteId,agencyId).first<{id:number;client_id:number;destination:string;total:number;status:string;converted_trip_id:number|null}>();
      if(!quote) throw new InputError("No se encontró la cotización.");
      if(quote.status!=="Aceptada") throw new InputError("La cotización debe estar aceptada antes de crear el viaje.");
      if(quote.converted_trip_id) throw new InputError("Esta cotización ya fue convertida en viaje.");
      const firstPayment=body.firstPaymentAmount?amount(body,"firstPaymentAmount"):0;
      if(firstPayment>quote.total) throw new InputError("El primer pago no puede superar el total del viaje.");
      const trip=await db.prepare("INSERT INTO trips (agency_id,client_id,destination,start_date,end_date,total,status) VALUES (?,?,?,?,?,?,?)").bind(agencyId,quote.client_id,quote.destination,start,end,quote.total,"Confirmado").run();
      const tripId=Number(trip.meta.last_row_id);
      await db.prepare("UPDATE quotes SET converted_trip_id=? WHERE id=? AND agency_id=? AND converted_trip_id IS NULL").bind(tripId,quoteId,agencyId).run();
      if(firstPayment>0) await db.prepare("INSERT INTO payments (agency_id,trip_id,amount,due_date,paid_at,method,note) VALUES (?,?,?,?,NULL,'Pendiente','Primer pago')").bind(agencyId,tripId,firstPayment,date(body,"paymentDueDate")).run();
      await db.batch([
        db.prepare("INSERT INTO tasks (agency_id,client_id,title,due_date,priority,completed) VALUES (?,?,?,?,?,0)").bind(agencyId,quote.client_id,`Confirmar servicios de ${quote.destination}`,today,"Alta"),
        db.prepare("INSERT INTO activities (agency_id,client_id,kind,detail,created_at) VALUES (?,?,?,?,?)").bind(agencyId,quote.client_id,"Viaje",`Cotización Q-${String(quoteId).padStart(4,"0")} convertida en viaje`,today),
      ]);
      responseData={tripId};
    }
    else if(body.action==="payment") await db.prepare("INSERT INTO payments (agency_id,trip_id,amount,due_date,paid_at,method,note) SELECT ?,id,?,?,?,?,? FROM trips WHERE id=? AND agency_id=?").bind(agencyId,amount(body,"amount"),date(body,"dueDate"),null,"Pendiente",text(body,"note",500,true),id(body,"tripId"),agencyId).run();
    else if(body.action==="task") await db.prepare("INSERT INTO tasks (agency_id,client_id,title,due_date,priority,completed) VALUES (?,?,?,?,?,0)").bind(agencyId,body.clientId?id(body,"clientId"):null,text(body,"title",200),date(body,"dueDate"),choice(body,"priority",["Baja","Normal","Alta"],"Normal")).run();
    else if(body.action==="activity") await db.prepare("INSERT INTO activities (agency_id,client_id,kind,detail,created_at) SELECT ?,id,?,?,? FROM clients WHERE id=? AND agency_id=?").bind(agencyId,choice(body,"kind",["Nota","Llamada","Email","WhatsApp"],"Nota"),text(body,"detail",2000),today,id(body,"clientId"),agencyId).run();
    else if(body.action==="traveler") await db.prepare("INSERT INTO travelers (agency_id,client_id,first_name,last_name,birth_date,nationality,notes) SELECT ?,id,?,?,?,?,? FROM clients WHERE id=? AND agency_id=?").bind(agencyId,text(body,"firstName",80),text(body,"lastName",80),text(body,"birthDate",10,true),text(body,"nationality",80,true),text(body,"notes",1000,true),id(body,"clientId"),agencyId).run();
    else if(body.action==="supplier") {
      const email=text(body,"email",254,true); if(email&&!/^\S+@\S+\.\S+$/.test(email)) throw new InputError("El email no es válido.");
      await db.prepare("INSERT INTO suppliers (agency_id,name,category,contact_name,email,phone,notes) VALUES (?,?,?,?,?,?,?)").bind(agencyId,text(body,"name",120),choice(body,"category",["Hotel","Aerolínea","Tour operador","Crucero","Transporte","Seguro","Otro"]),text(body,"contactName",120,true),email,text(body,"phone",40,true),text(body,"notes",1000,true)).run();
    }
    else if(body.action==="booking") {
      const tripId=id(body,"tripId"), supplierId=id(body,"supplierId");
      const valid=await db.prepare("SELECT 1 AS ok FROM trips t JOIN suppliers s ON s.id=? AND s.agency_id=t.agency_id WHERE t.id=? AND t.agency_id=?").bind(supplierId,tripId,agencyId).first();
      if(!valid) throw new InputError("El viaje o proveedor no pertenece a esta agencia.");
      await db.prepare("INSERT INTO bookings (agency_id,trip_id,supplier_id,service_type,confirmation,sale_amount,cost_amount,commission_amount,commission_due_date,status) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(agencyId,tripId,supplierId,choice(body,"serviceType",["Hotel","Vuelo","Tour","Crucero","Transporte","Seguro","Otro"]),text(body,"confirmation",100,true),amount(body,"saleAmount"),amount(body,"costAmount"),amount(body,"commissionAmount"),text(body,"commissionDueDate",10,true),"Confirmada").run();
    }
    else if(body.action==="receiveCommission") await db.prepare("UPDATE bookings SET commission_received_at=? WHERE id=? AND agency_id=? AND commission_received_at IS NULL").bind(today,id(body,"id"),agencyId).run();
    else if(body.action==="member") {
      if(context.role!=="owner"&&context.role!=="admin") throw new InputError("No tienes permiso para administrar el equipo.");
      const email=text(body,"email",254).toLowerCase(); if(!/^\S+@\S+\.\S+$/.test(email)) throw new InputError("El email no es válido.");
      const existing=await db.prepare("SELECT agency_id FROM agency_members WHERE email=?").bind(email).first<{agency_id:number}>();
      if(existing&&existing.agency_id!==agencyId) throw new InputError("Ese usuario ya pertenece a otra agencia.");
      if(existing) await db.prepare("UPDATE agency_members SET display_name=?,role=?,active=1 WHERE email=? AND agency_id=?").bind(text(body,"displayName",120,true),choice(body,"role",["admin","agent","viewer"]),email,agencyId).run();
      else await db.prepare("INSERT INTO agency_members (agency_id,email,display_name,role,active,created_at) VALUES (?,?,?,?,1,?)").bind(agencyId,email,text(body,"displayName",120,true),choice(body,"role",["admin","agent","viewer"]),new Date().toISOString()).run();
    }
    else if(body.action==="memberStatus") {
      if(context.role!=="owner"&&context.role!=="admin") throw new InputError("No tienes permiso para administrar el equipo.");
      const memberId=id(body,"id");
      const member=await db.prepare("SELECT email,role FROM agency_members WHERE id=? AND agency_id=?").bind(memberId,agencyId).first<{email:string;role:string}>();
      if(!member) throw new InputError("No se encontró el usuario.");
      if(member.email===context.email) throw new InputError("No puedes desactivar tu propia cuenta.");
      if(member.role==="owner") throw new InputError("La cuenta propietaria no puede desactivarse.");
      await db.prepare("UPDATE agency_members SET active=? WHERE id=? AND agency_id=?").bind(body.active?1:0,memberId,agencyId).run();
    }
    else if(body.action==="toggleTask") await db.prepare("UPDATE tasks SET completed=? WHERE id=? AND agency_id=?").bind(body.completed?1:0,id(body,"id"),agencyId).run();
    else if(body.action==="markPaid") await db.prepare("UPDATE payments SET paid_at=?,method=? WHERE id=? AND agency_id=? AND paid_at IS NULL").bind(today,text(body,"method",40,true)||"Registrado",id(body,"id"),agencyId).run();
    else throw new InputError("Acción no válida.");
    await db.prepare("INSERT INTO audit_logs (agency_id,actor_email,action,entity_type,created_at) VALUES (?,?,?,?,?)").bind(agencyId,context.email,String(body.action),String(body.action),new Date().toISOString()).run();
    return NextResponse.json({ok:true,...responseData});
  } catch (error) {
    if (error instanceof InputError)
      return NextResponse.json({ error: error.message }, { status: 400 });
    console.error(JSON.stringify({ event: "crm_write_failed", error: error instanceof Error ? error.message : "unknown" }));
    return NextResponse.json({ error: "No fue posible guardar. Intenta nuevamente." }, { status: 500 });
  }
}
