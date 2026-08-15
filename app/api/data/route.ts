import { env } from "cloudflare:workers";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

async function setup() {
  const db = env.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS clients (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', destination TEXT NOT NULL DEFAULT 'Por definir', status TEXT NOT NULL DEFAULT 'Nuevo', created_at TEXT NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS trips (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER NOT NULL, destination TEXT NOT NULL, start_date TEXT NOT NULL, end_date TEXT NOT NULL DEFAULT '', total REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'Cotización')`),
    db.prepare(`CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, trip_id INTEGER NOT NULL, amount REAL NOT NULL, due_date TEXT NOT NULL, paid_at TEXT, method TEXT NOT NULL DEFAULT 'Pendiente', note TEXT NOT NULL DEFAULT '')`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, client_id INTEGER, title TEXT NOT NULL, due_date TEXT NOT NULL, priority TEXT NOT NULL DEFAULT 'Normal', completed INTEGER NOT NULL DEFAULT 0)`),
  ]);
  const count = await db.prepare("SELECT COUNT(*) AS total FROM clients").first<{ total: number }>();
  if (!count?.total) await db.batch([
    db.prepare("INSERT INTO clients (name,email,phone,destination,status,created_at) VALUES (?,?,?,?,?,?)").bind("María González","maria@example.com","+1 (713) 555-0148","Cancún","Confirmado","2026-08-08"),
    db.prepare("INSERT INTO clients (name,email,phone,destination,status,created_at) VALUES (?,?,?,?,?,?)").bind("James Wilson","james@example.com","+1 (832) 555-0192","Costa Rica","Cotización","2026-08-10"),
    db.prepare("INSERT INTO clients (name,email,phone,destination,status,created_at) VALUES (?,?,?,?,?,?)").bind("Familia Ramírez","ramirez@example.com","+1 (281) 555-0165","Orlando","Apartado","2026-08-12"),
    db.prepare("INSERT INTO trips (client_id,destination,start_date,end_date,total,status) VALUES (1,'Cancún','2026-09-18','2026-09-23',3850,'Confirmado')"),
    db.prepare("INSERT INTO trips (client_id,destination,start_date,end_date,total,status) VALUES (2,'Costa Rica','2026-11-07','2026-11-15',5240,'Cotización')"),
    db.prepare("INSERT INTO trips (client_id,destination,start_date,end_date,total,status) VALUES (3,'Orlando','2026-10-03','2026-10-09',4680,'Apartado')"),
    db.prepare("INSERT INTO payments (trip_id,amount,due_date,paid_at,method,note) VALUES (1,1200,'2026-08-08','2026-08-08','Tarjeta','Anticipo')"),
    db.prepare("INSERT INTO payments (trip_id,amount,due_date,paid_at,method,note) VALUES (1,2650,'2026-08-20',NULL,'Pendiente','Saldo final')"),
    db.prepare("INSERT INTO payments (trip_id,amount,due_date,paid_at,method,note) VALUES (3,1000,'2026-08-12','2026-08-12','Zelle','Apartado')"),
    db.prepare("INSERT INTO payments (trip_id,amount,due_date,paid_at,method,note) VALUES (3,1840,'2026-08-16',NULL,'Pendiente','Segunda cuota')"),
    db.prepare("INSERT INTO payments (trip_id,amount,due_date,paid_at,method,note) VALUES (3,1840,'2026-09-12',NULL,'Pendiente','Saldo final')"),
    db.prepare("INSERT INTO tasks (client_id,title,due_date,priority,completed) VALUES (2,'Dar seguimiento a cotización de Costa Rica','2026-08-14','Alta',0)"),
    db.prepare("INSERT INTO tasks (client_id,title,due_date,priority,completed) VALUES (3,'Confirmar pago de segunda cuota','2026-08-16','Alta',0)"),
    db.prepare("INSERT INTO tasks (client_id,title,due_date,priority,completed) VALUES (1,'Enviar recomendaciones antes del viaje','2026-09-11','Normal',0)"),
  ]);
}

export async function GET() {
  await setup(); const db=env.DB;
  const [clients,trips,payments,tasks]=await Promise.all([
    db.prepare("SELECT * FROM clients ORDER BY id DESC").all(),
    db.prepare("SELECT t.*,c.name AS client_name FROM trips t JOIN clients c ON c.id=t.client_id ORDER BY t.start_date").all(),
    db.prepare("SELECT p.*,t.destination,c.name AS client_name FROM payments p JOIN trips t ON t.id=p.trip_id JOIN clients c ON c.id=t.client_id ORDER BY p.due_date").all(),
    db.prepare("SELECT t.*,c.name AS client_name FROM tasks t LEFT JOIN clients c ON c.id=t.client_id ORDER BY t.completed,t.due_date").all(),
  ]);
  return NextResponse.json({clients:clients.results,trips:trips.results,payments:payments.results,tasks:tasks.results});
}

export async function POST(request:Request) {
  await setup(); const body=await request.json() as Record<string,string|number|boolean|null>; const db=env.DB;
  if(body.action==="client") await db.prepare("INSERT INTO clients (name,email,phone,destination,status,created_at) VALUES (?,?,?,?,?,?)").bind(body.name,body.email??"",body.phone??"",body.destination??"Por definir","Nuevo",new Date().toISOString().slice(0,10)).run();
  else if(body.action==="payment") await db.prepare("INSERT INTO payments (trip_id,amount,due_date,paid_at,method,note) VALUES (?,?,?,?,?,?)").bind(body.tripId,body.amount,body.dueDate,null,"Pendiente",body.note??"").run();
  else if(body.action==="task") await db.prepare("INSERT INTO tasks (client_id,title,due_date,priority,completed) VALUES (?,?,?,?,0)").bind(body.clientId||null,body.title,body.dueDate,body.priority??"Normal").run();
  else if(body.action==="toggleTask") await db.prepare("UPDATE tasks SET completed=? WHERE id=?").bind(body.completed?1:0,body.id).run();
  else if(body.action==="markPaid") await db.prepare("UPDATE payments SET paid_at=?,method=? WHERE id=?").bind(new Date().toISOString().slice(0,10),body.method??"Registrado",body.id).run();
  else return NextResponse.json({error:"Acción no válida"},{status:400});
  return NextResponse.json({ok:true});
}
