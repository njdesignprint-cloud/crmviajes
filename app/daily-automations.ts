type PaymentReminder = {
  id: number;
  agency_id: number;
  client_id: number;
  due_date: string;
  amount: number;
  destination: string;
};

type TripReminder = {
  id: number;
  agency_id: number;
  client_id: number;
  start_date: string;
  destination: string;
};

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function claimEvent(db: D1Database, agencyId: number, key: string, now: string) {
  const result = await db.prepare(
    "INSERT OR IGNORE INTO automation_events (agency_id,event_key,created_at) VALUES (?,?,?)",
  ).bind(agencyId, key, now).run();
  return result.meta.changes > 0;
}

export async function runDailyAutomations(db: D1Database, instant = new Date()) {
  const today = isoDate(instant);
  const inThreeDays = isoDate(new Date(instant.getTime() + 3 * 86_400_000));
  const inSevenDays = isoDate(new Date(instant.getTime() + 7 * 86_400_000));
  const now = instant.toISOString();
  await db.prepare(
    "UPDATE agencies SET status='expired',updated_at=? WHERE status='trial' AND trial_ends_at IS NOT NULL AND trial_ends_at<=?",
  ).bind(now, now).run();
  const [payments, trips] = await Promise.all([
    db.prepare(
      "SELECT p.id,p.agency_id,t.client_id,p.due_date,p.amount,t.destination FROM payments p JOIN trips t ON t.id=p.trip_id AND t.agency_id=p.agency_id WHERE p.paid_at IS NULL AND p.due_date<=? ORDER BY p.due_date LIMIT 200",
    ).bind(inThreeDays).all<PaymentReminder>(),
    db.prepare(
      "SELECT id,agency_id,client_id,start_date,destination FROM trips WHERE start_date>? AND start_date<=? AND status!='Cancelado' ORDER BY start_date LIMIT 200",
    ).bind(today, inSevenDays).all<TripReminder>(),
  ]);

  let created = 0;
  for (const payment of payments.results) {
    const overdue = payment.due_date < today;
    const kind = overdue ? "overdue" : "upcoming";
    const key = `payment:${payment.id}:${payment.due_date}:${kind}`;
    if (!(await claimEvent(db, payment.agency_id, key, now))) continue;
    const amount = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(payment.amount);
    await db.prepare(
      "INSERT INTO tasks (agency_id,client_id,title,due_date,priority,completed) VALUES (?,?,?,?,?,0)",
    ).bind(payment.agency_id, payment.client_id, overdue ? `Cobro vencido de ${amount} · ${payment.destination}` : `Recordar cobro de ${amount} · ${payment.destination}`, today, overdue ? "Alta" : "Normal").run();
    created++;
  }
  for (const trip of trips.results) {
    const key = `trip:${trip.id}:${trip.start_date}:pretrip`;
    if (!(await claimEvent(db, trip.agency_id, key, now))) continue;
    await db.prepare(
      "INSERT INTO tasks (agency_id,client_id,title,due_date,priority,completed) VALUES (?,?,?,?,?,0)",
    ).bind(trip.agency_id, trip.client_id, `Revisar documentos y servicios · ${trip.destination}`, today, "Alta").run();
    created++;
  }
  console.log(JSON.stringify({ event: "daily_automations_complete", date: today, tasksCreated: created }));
  return { created };
}
