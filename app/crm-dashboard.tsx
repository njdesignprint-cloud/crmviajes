"use client";
import Link from "next/link";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
type Client = {
  id: number;
  name: string;
  email: string;
  phone: string;
  destination: string;
  status: string;
};
type Trip = {
  id: number;
  client_id: number;
  client_name: string;
  destination: string;
  start_date: string;
  end_date: string;
  total: number;
  status: string;
};
type Payment = {
  id: number;
  trip_id: number;
  client_name: string;
  destination: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  method: string;
  note: string;
};
type Task = {
  id: number;
  client_id: number | null;
  client_name: string | null;
  title: string;
  due_date: string;
  priority: string;
  completed: number;
};
type Quote = {
  id: number;
  client_id: number;
  client_name: string;
  destination: string;
  travelers: number;
  subtotal: number;
  taxes: number;
  total: number;
  status: string;
  valid_until: string;
  created_at: string;
  notes: string;
  item_count?: number;
  converted_trip_id?: number | null;
};
type Activity = {
  id: number;
  client_id: number;
  client_name: string;
  kind: string;
  detail: string;
  created_at: string;
};
type Traveler = { id:number; client_id:number; client_name:string; first_name:string; last_name:string; birth_date:string; nationality:string; notes:string };
type Supplier = { id:number; name:string; category:string; contact_name:string; email:string; phone:string; notes:string };
type Booking = { id:number; trip_id:number; supplier_id:number; client_name:string; destination:string; supplier_name:string; service_type:string; confirmation:string; sale_amount:number; cost_amount:number; commission_amount:number; commission_due_date:string; commission_received_at:string|null; status:string };
type Member = { id:number; email:string; display_name:string; role:string; active:number; created_at:string };
type Data = {
  clients: Client[];
  trips: Trip[];
  payments: Payment[];
  tasks: Task[];
  quotes: Quote[];
  activities: Activity[];
  travelers: Traveler[];
  suppliers: Supplier[];
  bookings: Booking[];
  members: Member[];
  user?: { email: string; displayName: string; role: string };
};
type Modal =
  "client" | "editClient" | "archiveClient" | "trip" | "quote" | "payment" | "task" | "activity" | "traveler" | "supplier" | "booking" | "convertQuote" | "member" | null;
const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const shortDate = (v: string) =>
  new Intl.DateTimeFormat("es-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${v}T12:00:00Z`));

export function CrmDashboard({ demo = false }: { demo?: boolean }) {
  const [data, setData] = useState<Data>({
    clients: [],
    trips: [],
    payments: [],
    tasks: [],
    quotes: [],
    activities: [],
    travelers: [],
    suppliers: [],
    bookings: [],
    members: [],
  });
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("Inicio");
  const [modal, setModal] = useState<Modal>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch(demo ? "/api/demo" : "/api/data", {
        cache: "no-store",
        credentials: "include",
      });
      const payload = await r.json() as Data & { error?: string };
      if (!r.ok) throw new Error(payload.error || "No se pudo cargar el CRM.");
      setData(payload);
      setError(null);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      setError(
        message === "Failed to fetch"
          ? "La sesión segura no llegó a la API. Recarga la página para renovar el acceso."
          : message || "No se pudo cargar el CRM.",
      );
    } finally {
      setLoading(false);
    }
  }, [demo]);
  // The initial fetch synchronizes this client dashboard with the D1 API.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  const pending = data.payments.filter((p) => !p.paid_at),
    dueTotal = pending.reduce((s, p) => s + Number(p.amount), 0),
    collected = data.payments
      .filter((p) => p.paid_at)
      .reduce((s, p) => s + Number(p.amount), 0),
    openTasks = data.tasks.filter((t) => !t.completed);
  const filtered = useMemo(
    () =>
      data.clients.filter((c) =>
        `${c.name} ${c.email} ${c.phone} ${c.destination}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [data.clients, search],
  );
  async function submit(
    action: string,
    values: Record<string, FormDataEntryValue>,
  ) {
    if (demo) {
      setNotice("Esta demostración es de solo lectura. Inicia sesión para guardar información real.");
      setModal(null);
      return;
    }
    setSaving(true);
    try {
      await post(action, values);
      await load();
      setModal(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }
  async function post(action: string, values: Record<string, unknown>) {
    if (demo) {
      setNotice("Esta acción está disponible en el CRM privado.");
      return;
    }
    const response = await fetch("/api/data", {
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...values }),
    });
    const payload = await response.json() as Record<string, unknown> & { error?: string };
    if (!response.ok) throw new Error(payload.error || "No se pudo guardar.");
    return payload as Record<string, unknown>;
  }
  async function quick(action: string, values: Record<string, unknown>) {
    try {
      await post(action, values);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar.");
    }
  }
  const sales = data.trips.reduce((s, t) => s + Number(t.total), 0),
    quoteTotal = data.quotes.reduce((s, q) => s + Number(q.total), 0),
    conversion = data.quotes.length
      ? Math.round(
          (data.quotes.filter((q) => q.status === "Aceptada").length /
            data.quotes.length) *
            100,
        )
      : 0;
  const expectedCommission = data.bookings.reduce((sum, booking) => sum + Number(booking.commission_amount), 0);
  const receivedCommission = data.bookings.filter((booking) => booking.commission_received_at).reduce((sum, booking) => sum + Number(booking.commission_amount), 0);
  const displayName = data.user?.displayName || (demo ? "Noel Díaz" : "Mi cuenta");
  const canWrite = demo || data.user?.role !== "viewer";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "R";
  const todayLabel = new Intl.DateTimeFormat("es-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date()).toUpperCase();
  function navigateTo(nextSection: string) {
    setModal(null);
    setSelectedClient(null);
    setSelectedQuoteId(null);
    setSection(nextSection);
  }
  function exportReport() {
    const rows = [
      ["Indicador", "Valor"],
      ["Clientes", data.clients.length],
      ["Viajes", data.trips.length],
      ["Ventas activas", sales],
      ["Cobrado", collected],
      ["Por cobrar", dueTotal],
      ["Cotizaciones", data.quotes.length],
      ["Conversión", `${conversion}%`],
      ["Comisión esperada", expectedCommission],
      ["Comisión recibida", receivedCommission],
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    link.download = `travelclientpro-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
  async function shareQuote(id: number) {
    try {
      const payload = await post("shareQuote", { id });
      if (!payload || typeof payload.path !== "string") return;
      const url = `${window.location.origin}${payload.path}`;
      await navigator.clipboard.writeText(url);
      setError(null);
      setNotice("Enlace seguro copiado. Ya puedes enviarlo al cliente.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear el enlace.");
    }
  }
  return (
    <>
      {demo && (
        <div className="demo-topbar">
          <div>
            <b className="demo-brand">T</b>
            <strong>Estás explorando la demo</strong>
            <span>Los datos son ficticios y no se guardan.</span>
          </div>
          <nav aria-label="Opciones de la demo">
            <Link href="/">← Salir de la demo</Link>
            <Link className="demo-login" href="/registro/">
              Crear mi cuenta real →
            </Link>
          </nav>
        </div>
      )}
      <div className={`app-shell ${demo ? "with-demo-bar" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">T</span>
          <div>
            <strong>TravelClientPro</strong>
            <small>Travel Business Platform</small>
          </div>
        </div>
        <nav>
          {[
            "Inicio",
            "Clientes",
            "Cotizaciones",
            "Viajes",
            "Pagos",
            "Tareas",
            "Operación",
            "Actividad",
            "Equipo",
            "Reportes",
          ].map((item, i) => (
            <button
              key={item}
              className={section === item ? "active" : ""}
              onClick={() => navigateTo(item)}
            >
              <span>{["⌂", "◎", "▤", "✦", "$", "✓", "◆", "◷", "♙", "↗"][i]}</span>
              {item}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="avatar">{initials}</div>
          <div>
            <strong>{displayName}</strong>
            <small>{data.user?.role === "owner" ? "Propietario" : data.user?.role || "Demostración"}</small>
          </div>
          <span className="online">●</span>
        </div>
        {!demo && <Link className="account-link" href="/mi-cuenta/">Plan y cuenta →</Link>}
      </aside>
      <main>
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Cerrar aviso">×</button>
          </div>
        )}
        {notice && (
          <div className="notice-banner" role="status">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} aria-label="Cerrar aviso">×</button>
          </div>
        )}
        {modal ? (
          <ModalForm
            type={modal}
            clients={data.clients}
            trips={data.trips}
            suppliers={data.suppliers}
            quoteId={selectedQuoteId}
            selectedClient={selectedClient}
            saving={saving}
            close={() => setModal(null)}
            submit={submit}
          />
        ) : (
        <>
        <header className="topbar">
          <div>
            <p className="eyebrow">{todayLabel}</p>
            <h1>{section}</h1>
          </div>
          <div className="top-actions">
            <label className="search">
              ⌕
              <input
                aria-label="Buscar"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
              />
            </label>
            <button className="notification" aria-label="Notificaciones">
              ◦
            </button>
            {canWrite && (section === "Inicio" || section === "Clientes") && <button className="primary" onClick={() => setModal("client")}>
              ＋ Nuevo cliente
            </button>}
          </div>
        </header>
        {loading ? (
          <div className="loading">Organizando tu agencia…</div>
        ) : section === "Inicio" ? (
          <>
            <section className="hero-row">
              <div>
                <p className="eyebrow coral">RESUMEN DE HOY</p>
                <h2>Buenos días, {displayName.split(" ")[0]}.</h2>
                <p>
                  Tienes <strong>{openTasks.length} pendientes</strong> y{" "}
                  <strong>{pending.length} cobros</strong> que requieren
                  atención.
                </p>
              </div>
              <button className="soft-button" onClick={() => setModal("task")}>
                ＋ Agregar tarea
              </button>
            </section>
            <section className="metrics">
              <Metric
                label="Por cobrar"
                value={money.format(dueTotal)}
                note={`${pending.length} pagos pendientes`}
                tone="coral"
              />
              <Metric
                label="Cobrado"
                value={money.format(collected)}
                note="Pagos registrados"
                tone="green"
              />
              <Metric
                label="Ventas activas"
                value={money.format(sales)}
                note={`${data.trips.length} viajes`}
                tone="blue"
              />
              <Metric
                label="Conversión"
                value={`${conversion}%`}
                note={`${data.quotes.length} cotizaciones`}
                tone="sand"
              />
            </section>
            <section className="grid-two">
              <div className="panel">
                <PanelTitle
                  title="Próximos cobros"
                  action="Ver todos"
                  onClick={() => setSection("Pagos")}
                />
                <div className="rows">
                  {pending.slice(0, 4).map((p) => (
                    <div className="payment-row" key={p.id}>
                      <div className="date-chip">
                        <b>{shortDate(p.due_date).split(" ")[1]}</b>
                        <span>{shortDate(p.due_date).split(" ")[0]}</span>
                      </div>
                      <div className="grow">
                        <strong>{p.client_name}</strong>
                        <small>
                          {p.destination} · {p.note}
                        </small>
                      </div>
                      <div className="amount">
                        <strong>{money.format(p.amount)}</strong>
                        <button
                          onClick={() =>
                            quick("markPaid", {
                              id: p.id,
                              method: "Registrado",
                            })
                          }
                        >
                          Registrar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <PanelTitle
                  title="Tareas pendientes"
                  action="Nueva tarea"
                  onClick={() => setModal("task")}
                />
                <div className="rows">
                  {openTasks.slice(0, 4).map((t) => (
                    <label className="task-row" key={t.id}>
                      <input
                        type="checkbox"
                        onChange={() =>
                          quick("toggleTask", { id: t.id, completed: true })
                        }
                      />
                      <span
                        className={
                          t.priority === "Alta" ? "check high" : "check"
                        }
                      />
                      <div className="grow">
                        <strong>{t.title}</strong>
                        <small>{t.client_name || "Tarea interna"}</small>
                      </div>
                      <time>{shortDate(t.due_date)}</time>
                    </label>
                  ))}
                </div>
              </div>
            </section>
            <section className="panel upcoming">
              <PanelTitle
                title="Próximos viajes"
                action="Ver calendario"
                onClick={() => setSection("Viajes")}
              />
              <div className="trip-grid">
                {data.trips.map((t) => (
                  <div className="trip-card" key={t.id}>
                    <div className="trip-icon">{t.destination[0]}</div>
                    <div>
                      <span className={`status ${t.status.toLowerCase()}`}>
                        {t.status}
                      </span>
                      <h3>{t.destination}</h3>
                      <p>{t.client_name}</p>
                      <small>
                        {shortDate(t.start_date)} — {shortDate(t.end_date)}
                      </small>
                    </div>
                    <strong>{money.format(t.total)}</strong>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : section === "Clientes" ? (
          <ListPage
            title="Clientes"
            description="Expediente comercial e historial de cada viajero."
            action="Nuevo cliente"
            onAction={() => setModal("client")}
          >
            <div className="table-list">
              {filtered.map((c) => (
                <div className="client-line" key={c.id}>
                  <div className="client-avatar">
                    {c.name
                      .split(" ")
                      .map((x) => x[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div className="grow">
                    <strong>{c.name}</strong>
                    <small>
                      {c.email} · {c.phone}
                    </small>
                  </div>
                  <span>{c.destination}</span>
                  <span className="status confirmado">{c.status}</span>
                  {canWrite&&<div className="row-actions"><button className="mini-button" onClick={()=>{setSelectedClient(c);setModal("editClient");}}>Editar</button><button className="mini-button danger" onClick={()=>{setSelectedClient(c);setModal("archiveClient");}}>Archivar</button></div>}
                </div>
              ))}
            </div>
          </ListPage>
        ) : section === "Cotizaciones" ? (
          <ListPage
            title="Cotizaciones"
            description={`${money.format(quoteTotal)} en oportunidades abiertas.`}
            action="Nueva cotización"
            onAction={() => setModal("quote")}
          >
            <div className="table-list">
              {data.quotes.length ? (
                data.quotes.map((q) => (
                  <div className="client-line quote-line" key={q.id}>
                    <div className="quote-id">
                      Q-{String(q.id).padStart(4, "0")}
                    </div>
                    <div className="grow">
                      <strong>
                        {q.client_name} · {q.destination}
                      </strong>
                      <small>
                        {q.travelers} viajeros · {q.item_count || 0} partidas · válida hasta{" "}
                        {shortDate(q.valid_until)}
                      </small>
                    </div>
                    <strong>{money.format(q.total)}</strong>
                    <button className="mini-button" onClick={() => shareQuote(q.id)}>Compartir</button>
                    {q.status === "Aceptada" && !q.converted_trip_id && <button className="mini-button" onClick={() => {setSelectedQuoteId(q.id);setModal("convertQuote");}}>Crear viaje</button>}
                    {q.converted_trip_id && <span className="status confirmado">Viaje creado</span>}
                    <select
                      aria-label={`Estado de cotización ${q.id}`}
                      value={q.status}
                      onChange={(e) =>
                        quick("quoteStatus", {
                          id: q.id,
                          status: e.target.value,
                        })
                      }
                    >
                      <option>Borrador</option>
                      <option>Enviada</option>
                      <option>Aceptada</option>
                      <option>Rechazada</option>
                    </select>
                  </div>
                ))
              ) : (
                <Empty text="Crea tu primera cotización profesional." />
              )}
            </div>
          </ListPage>
        ) : section === "Viajes" ? (
          <ListPage
            title="Viajes"
            description="Reservas, fechas y saldos de cada experiencia."
            action="Nuevo viaje"
            onAction={() => setModal("trip")}
          >
            <div className="table-list">
              {data.trips.map((t) => (
                <div className="client-line" key={t.id}>
                  <div className="trip-icon small">{t.destination[0]}</div>
                  <div className="grow">
                    <strong>{t.destination}</strong>
                    <small>
                      {t.client_name} · {shortDate(t.start_date)} —{" "}
                      {shortDate(t.end_date)}
                    </small>
                  </div>
                  <strong>{money.format(t.total)}</strong>
                  <span className="status confirmado">{t.status}</span>
                </div>
              ))}
            </div>
          </ListPage>
        ) : section === "Pagos" ? (
          <ListPage
            title="Pagos"
            description={`${money.format(dueTotal)} pendientes por cobrar.`}
            action="Agregar pago"
            onAction={() => setModal("payment")}
          >
            <div className="table-list">
              {data.payments.map((p) => (
                <div className="client-line" key={p.id}>
                  <div className={`pay-dot ${p.paid_at ? "paid" : ""}`}>$</div>
                  <div className="grow">
                    <strong>{p.client_name}</strong>
                    <small>
                      {p.destination} · {p.note} · vence {shortDate(p.due_date)}
                    </small>
                  </div>
                  <strong>{money.format(p.amount)}</strong>
                  {p.paid_at ? (
                    <span className="status confirmado">Pagado</span>
                  ) : (
                    <button
                      className="mini-button"
                      onClick={() =>
                        quick("markPaid", { id: p.id, method: "Registrado" })
                      }
                    >
                      Registrar pago
                    </button>
                  )}
                </div>
              ))}
            </div>
          </ListPage>
        ) : section === "Tareas" ? (
          <ListPage
            title="Tareas"
            description="Seguimientos y recordatorios del equipo."
            action="Nueva tarea"
            onAction={() => setModal("task")}
          >
            <div className="table-list">
              {data.tasks.map((t) => (
                <label
                  className={`client-line ${t.completed ? "done" : ""}`}
                  key={t.id}
                >
                  <input
                    type="checkbox"
                    checked={!!t.completed}
                    onChange={() =>
                      quick("toggleTask", { id: t.id, completed: !t.completed })
                    }
                  />
                  <div className="grow">
                    <strong>{t.title}</strong>
                    <small>{t.client_name || "Tarea interna"}</small>
                  </div>
                  <span>{shortDate(t.due_date)}</span>
                  <span className={`priority ${t.priority.toLowerCase()}`}>
                    {t.priority}
                  </span>
                </label>
              ))}
            </div>
          </ListPage>
        ) : section === "Operación" ? (
          <ListPage
            title="Operación y comisiones"
            description={`${money.format(expectedCommission - receivedCommission)} en comisiones pendientes.`}
            action="Nueva reserva"
            onAction={() => setModal("booking")}
          >
            <div className="operation-actions">
              <button className="mini-button" onClick={() => setModal("supplier")}>＋ Proveedor</button>
              <button className="mini-button" onClick={() => setModal("traveler")}>＋ Viajero</button>
            </div>
            <section className="metrics reports">
              <Metric label="Comisión esperada" value={money.format(expectedCommission)} note={`${data.bookings.length} reservas`} tone="sand" />
              <Metric label="Comisión recibida" value={money.format(receivedCommission)} note="Ingresos confirmados" tone="green" />
              <Metric label="Proveedores" value={String(data.suppliers.length)} note="Directorio operativo" tone="blue" />
              <Metric label="Viajeros" value={String(data.travelers.length)} note="Perfiles registrados" tone="coral" />
            </section>
            <div className="table-list">
              {data.bookings.length ? data.bookings.map((booking) => (
                <div className="client-line" key={booking.id}>
                  <div className="trip-icon small">{booking.service_type[0]}</div>
                  <div className="grow">
                    <strong>{booking.client_name} · {booking.service_type}</strong>
                    <small>{booking.supplier_name} · {booking.destination}{booking.confirmation ? ` · ${booking.confirmation}` : ""}</small>
                  </div>
                  <div><strong>{money.format(booking.commission_amount)}</strong><small> comisión</small></div>
                  {booking.commission_received_at ? <span className="status confirmado">Recibida</span> : <button className="mini-button" onClick={() => quick("receiveCommission", {id:booking.id})}>Registrar comisión</button>}
                </div>
              )) : <Empty text="Registra proveedores y reservas para controlar tus comisiones." />}
            </div>
          </ListPage>
        ) : section === "Actividad" ? (
          <ListPage
            title="Actividad"
            description="Notas, llamadas y seguimiento del cliente."
            action="Registrar actividad"
            onAction={() => setModal("activity")}
          >
            <div className="timeline">
              {data.activities.length ? (
                data.activities.map((a) => (
                  <div className="timeline-item" key={a.id}>
                    <span>{a.kind[0]}</span>
                    <div>
                      <strong>{a.client_name}</strong>
                      <p>{a.detail}</p>
                      <small>
                        {a.kind} · {shortDate(a.created_at)}
                      </small>
                    </div>
                  </div>
                ))
              ) : (
                <Empty text="Aún no hay actividad registrada." />
              )}
            </div>
          </ListPage>
        ) : section === "Equipo" ? (
          <ListPage title="Equipo" description="Administra quién puede entrar al CRM y qué permisos tiene cada persona." action={demo||data.user?.role==="owner"||data.user?.role==="admin"?"Agregar usuario":undefined} onAction={()=>setModal("member")}>
            <div className="table-list">
              {data.members.length ? data.members.map(member=><div className={`client-line ${member.active?"":"done"}`} key={member.id}>
                <div className="client-avatar">{(member.display_name||member.email).slice(0,2).toUpperCase()}</div>
                <div className="grow"><strong>{member.display_name||member.email}</strong><small>{member.email}</small></div>
                <span className="status confirmado">{member.role}</span>
                {member.email!==data.user?.email&&member.role!=="owner"&&<button className="mini-button" onClick={()=>quick("memberStatus",{id:member.id,active:!member.active})}>{member.active?"Desactivar":"Activar"}</button>}
              </div>) : <Empty text="La administración del equipo está disponible para propietarios y administradores." />}
            </div>
          </ListPage>
        ) : (
          <ListPage
            title="Reportes"
            description="Indicadores comerciales y financieros en tiempo real."
            action="Exportar CSV"
            onAction={exportReport}
          >
            <section className="metrics reports">
              <Metric
                label="Ventas activas"
                value={money.format(sales)}
                note="Valor de viajes"
                tone="blue"
              />
              <Metric
                label="Cobranza"
                value={money.format(collected)}
                note="Ingresos registrados"
                tone="green"
              />
              <Metric
                label="Cuentas por cobrar"
                value={money.format(dueTotal)}
                note="Saldo pendiente"
                tone="coral"
              />
              <Metric
                label="Pipeline"
                value={money.format(quoteTotal)}
                note={`${conversion}% conversión`}
                tone="sand"
              />
            </section>
            <div className="report-note">
              <strong>Resumen ejecutivo</strong>
              <p>
                Tu agencia administra {data.clients.length} clientes,{" "}
                {data.trips.length} viajes y {data.quotes.length} oportunidades
                comerciales. Hay {money.format(expectedCommission - receivedCommission)} en
                comisiones pendientes de recibir.
              </p>
            </div>
          </ListPage>
        )}
        </>
        )}
      </main>
      </div>
    </>
  );
}
function Metric({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone: string;
}) {
  return (
    <article className="metric">
      <span className={`metric-icon ${tone}`}>
        {tone === "coral"
          ? "$"
          : tone === "green"
            ? "✓"
            : tone === "blue"
              ? "✦"
              : "◎"}
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}
function PanelTitle({
  title,
  action,
  onClick,
}: {
  title: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="panel-title">
      <h3>{title}</h3>
      <button onClick={onClick}>{action} →</button>
    </div>
  );
}
function ListPage({
  title,
  description,
  action,
  onAction,
  children,
}: {
  title: string;
  description: string;
  action?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="list-page">
      <div className="list-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        {action && (
          <button className="primary" onClick={onAction}>
            ＋ {action}
          </button>
        )}
      </div>
      <div className="panel">{children}</div>
    </section>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <strong>Todo listo para comenzar</strong>
      <p>{text}</p>
    </div>
  );
}
function ModalForm({
  type,
  clients,
  trips,
  suppliers,
  quoteId,
  selectedClient,
  saving,
  close,
  submit,
}: {
  type: Exclude<Modal, null>;
  clients: Client[];
  trips: Trip[];
  suppliers: Supplier[];
  quoteId: number | null;
  selectedClient: Client | null;
  saving: boolean;
  close: () => void;
  submit: (a: string, v: Record<string, FormDataEntryValue>) => void;
}) {
  const [items, setItems] = useState([{ category: "Hotel", description: "", quantity: 1, unitPrice: 0 }]);
  const send = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (type === "quote") values.items = JSON.stringify(items);
    submit(type, values);
  };
  const titles = {
    client: "Agregar cliente",
    editClient: "Editar cliente",
    archiveClient: "Archivar cliente",
    trip: "Crear viaje",
    quote: "Nueva cotización",
    payment: "Agregar pago",
    task: "Agregar tarea",
    activity: "Registrar actividad",
    traveler: "Agregar viajero",
    supplier: "Agregar proveedor",
    booking: "Registrar reserva",
    convertQuote: "Convertir en viaje",
    member: "Agregar usuario",
  };
  const descriptions = {
    client: "Crea la ficha comercial de una persona interesada en viajar.",
    editClient: "Actualiza los datos de contacto y la etapa comercial del cliente.",
    archiveClient: "Retira al cliente de la lista activa sin eliminar su historial.",
    trip: "Registra un viaje vendido con sus fechas y valor total.",
    quote: "Prepara una propuesta detallada que podrás compartir con el cliente.",
    payment: "Programa un cobro asociado a uno de los viajes de la agencia.",
    task: "Crea un recordatorio de seguimiento para el equipo.",
    activity: "Guarda una llamada, mensaje, correo o nota en el historial del cliente.",
    traveler: "Registra los datos de una persona que participará en el viaje.",
    supplier: "Añade una empresa de hotel, vuelo, tour u otro servicio.",
    booking: "Controla una reserva, su costo, venta, confirmación y comisión.",
    convertQuote: "Convierte una propuesta aceptada en un viaje operativo.",
    member: "Autoriza a otra persona para trabajar dentro del CRM de la agencia.",
  };
  return (
    <section className="form-page">
      <form className="form-page-card" onSubmit={send}>
        <div className="form-page-head">
          <div>
            <p className="eyebrow coral">TRAVELCLIENTPRO</p>
            <h2>{titles[type]}</h2>
            <p className="form-page-description">{descriptions[type]}</p>
          </div>
          <button type="button" className="secondary" onClick={close}>
            ← Volver
          </button>
        </div>
        {type === "client" && (
          <>
            <Field label="Nombre completo" name="name" required />
            <div className="form-grid">
              <Field label="Teléfono" name="phone" />
              <Field label="Email" name="email" type="email" />
            </div>
            <div className="form-grid">
              <Field label="Destino de interés" name="destination" />
              <label>
                Etapa
                <select name="status">
                  <option>Nuevo</option>
                  <option>Cotización</option>
                  <option>Apartado</option>
                  <option>Confirmado</option>
                </select>
                <FieldHint>Selecciona el punto actual del proceso de venta.</FieldHint>
              </label>
            </div>
          </>
        )}
        {type === "trip" && (
          <>
            <ClientSelect clients={clients} />
            <Field label="Destino" name="destination" required />
            <div className="form-grid">
              <Field label="Salida" name="startDate" type="date" required />
              <Field label="Regreso" name="endDate" type="date" required />
            </div>
            <Field label="Total (USD)" name="total" type="number" required />
          </>
        )}
        {type === "quote" && (
          <>
            <ClientSelect clients={clients} />
            <div className="form-grid">
              <Field label="Destino" name="destination" required />
              <Field label="Viajeros" name="travelers" type="number" required />
            </div>
            <div className="quote-builder">
              <p className="field-section-help">Agrega cada servicio por separado: categoría, descripción, cantidad y precio unitario.</p>
              <div className="quote-builder-head"><strong>Partidas</strong><button type="button" className="mini-button" onClick={()=>setItems([...items,{category:"Otro",description:"",quantity:1,unitPrice:0}])}>＋ Agregar</button></div>
              {items.map((item,index)=><div className="quote-item" key={index}>
                <select aria-label={`Categoría ${index+1}`} value={item.category} onChange={(e)=>setItems(items.map((current,i)=>i===index?{...current,category:e.target.value}:current))}><option>Hotel</option><option>Vuelo</option><option>Tour</option><option>Crucero</option><option>Transporte</option><option>Seguro</option><option>Honorarios</option><option>Otro</option></select>
                <input aria-label={`Descripción ${index+1}`} placeholder="Descripción del servicio" required value={item.description} onChange={(e)=>setItems(items.map((current,i)=>i===index?{...current,description:e.target.value}:current))}/>
                <input aria-label={`Cantidad ${index+1}`} title="Cantidad de unidades o viajeros" type="number" min="1" required value={item.quantity} onChange={(e)=>setItems(items.map((current,i)=>i===index?{...current,quantity:Number(e.target.value)}:current))}/>
                <input aria-label={`Precio ${index+1}`} title="Precio unitario en dólares" type="number" min="0" step="0.01" required value={item.unitPrice} onChange={(e)=>setItems(items.map((current,i)=>i===index?{...current,unitPrice:Number(e.target.value)}:current))}/>
                <strong>{money.format(item.quantity*item.unitPrice)}</strong>
                {items.length>1&&<button type="button" aria-label={`Eliminar partida ${index+1}`} onClick={()=>setItems(items.filter((_,i)=>i!==index))}>×</button>}
              </div>)}
              <div className="quote-total"><span>Subtotal</span><strong>{money.format(items.reduce((sum,item)=>sum+item.quantity*item.unitPrice,0))}</strong></div>
            </div>
            <Field label="Impuestos (USD)" name="taxes" type="number" required />
            <Field
              label="Válida hasta"
              name="validUntil"
              type="date"
              required
            />
            <Field
              label="Notas"
              name="notes"
              placeholder="Hotel, vuelos y servicios incluidos…"
            />
          </>
        )}
        {type === "payment" && (
          <>
            <label>
              Viaje
              <select name="tripId" required>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.client_name} — {t.destination}
                  </option>
                ))}
              </select>
              <FieldHint>Selecciona el viaje al que pertenece este cobro.</FieldHint>
            </label>
            <div className="form-grid">
              <Field label="Monto (USD)" name="amount" type="number" required />
              <Field label="Vencimiento" name="dueDate" type="date" required />
            </div>
            <Field
              label="Concepto"
              name="note"
              placeholder="Anticipo, cuota, saldo…"
            />
          </>
        )}
        {type === "task" && (
          <>
            <Field label="Tarea" name="title" required />
            <ClientSelect clients={clients} optional />
            <div className="form-grid">
              <Field label="Fecha" name="dueDate" type="date" required />
              <label>
                Prioridad
                <select name="priority">
                  <option>Normal</option>
                  <option>Alta</option>
                  <option>Baja</option>
                </select>
                <FieldHint>Indica qué tan urgente es completar esta tarea.</FieldHint>
              </label>
            </div>
          </>
        )}
        {type === "activity" && (
          <>
            <ClientSelect clients={clients} />
            <label>
              Tipo
              <select name="kind">
                <option>Nota</option>
                <option>Llamada</option>
                <option>Email</option>
                <option>WhatsApp</option>
              </select>
              <FieldHint>Selecciona el medio o tipo de interacción realizada.</FieldHint>
            </label>
            <Field
              label="Detalle"
              name="detail"
              required
              placeholder="Resumen de la conversación o próximo paso…"
            />
          </>
        )}
        {type === "editClient" && selectedClient && (
          <>
            <input type="hidden" name="clientId" value={selectedClient.id} />
            <Field label="Nombre completo" name="name" required defaultValue={selectedClient.name} />
            <div className="form-grid"><Field label="Teléfono" name="phone" defaultValue={selectedClient.phone} /><Field label="Email" name="email" type="email" defaultValue={selectedClient.email} /></div>
            <div className="form-grid"><Field label="Destino de interés" name="destination" defaultValue={selectedClient.destination} /><label>Etapa<select name="status" defaultValue={selectedClient.status}><option>Nuevo</option><option>Cotización</option><option>Apartado</option><option>Confirmado</option></select><FieldHint>Actualiza el punto del proceso de venta.</FieldHint></label></div>
          </>
        )}
        {type === "archiveClient" && selectedClient && (
          <div className="archive-confirmation">
            <input type="hidden" name="id" value={selectedClient.id} />
            <strong>¿Archivar a {selectedClient.name}?</strong>
            <p>El cliente dejará de aparecer en la lista activa. Su historial se conservará.</p>
          </div>
        )}
        {type === "traveler" && (
          <>
            <ClientSelect clients={clients} />
            <div className="form-grid">
              <Field label="Nombre" name="firstName" required />
              <Field label="Apellido" name="lastName" required />
            </div>
            <div className="form-grid">
              <Field label="Fecha de nacimiento" name="birthDate" type="date" />
              <Field label="Nacionalidad" name="nationality" />
            </div>
            <Field label="Preferencias o notas" name="notes" />
          </>
        )}
        {type === "supplier" && (
          <>
            <Field label="Proveedor" name="name" required />
            <div className="form-grid">
              <label>Categoría<select name="category"><option>Hotel</option><option>Aerolínea</option><option>Tour operador</option><option>Crucero</option><option>Transporte</option><option>Seguro</option><option>Otro</option></select><FieldHint>Tipo principal de servicio que ofrece.</FieldHint></label>
              <Field label="Contacto" name="contactName" />
            </div>
            <div className="form-grid"><Field label="Email" name="email" type="email" /><Field label="Teléfono" name="phone" /></div>
            <Field label="Notas" name="notes" />
          </>
        )}
        {type === "booking" && (
          <>
            <label>Viaje<select name="tripId" required>{trips.map((trip)=><option key={trip.id} value={trip.id}>{trip.client_name} — {trip.destination}</option>)}</select><FieldHint>Viaje al que pertenece esta reserva.</FieldHint></label>
            <label>Proveedor<select name="supplierId" required>{suppliers.map((supplier)=><option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select><FieldHint>Empresa que prestará el servicio reservado.</FieldHint></label>
            <div className="form-grid">
              <label>Servicio<select name="serviceType"><option>Hotel</option><option>Vuelo</option><option>Tour</option><option>Crucero</option><option>Transporte</option><option>Seguro</option><option>Otro</option></select><FieldHint>Clase de servicio que estás reservando.</FieldHint></label>
              <Field label="Confirmación" name="confirmation" />
            </div>
            <div className="form-grid"><Field label="Venta (USD)" name="saleAmount" type="number" required /><Field label="Costo (USD)" name="costAmount" type="number" required /></div>
            <div className="form-grid"><Field label="Comisión (USD)" name="commissionAmount" type="number" required /><Field label="Fecha esperada" name="commissionDueDate" type="date" /></div>
          </>
        )}
        {type === "convertQuote" && (
          <>
            <input type="hidden" name="quoteId" value={quoteId || ""} />
            <p className="form-help">Las partidas y el total de la propuesta se conservarán en el nuevo viaje.</p>
            <div className="form-grid"><Field label="Salida" name="startDate" type="date" required /><Field label="Regreso" name="endDate" type="date" required /></div>
            <div className="form-grid"><Field label="Primer pago (opcional)" name="firstPaymentAmount" type="number" /><Field label="Vencimiento del pago" name="paymentDueDate" type="date" /></div>
          </>
        )}
        {type === "member" && (
          <>
            <Field label="Nombre" name="displayName" />
            <Field label="Email autorizado" name="email" type="email" required />
            <label>Rol<select name="role"><option value="agent">Agente</option><option value="viewer">Solo lectura</option><option value="admin">Administrador</option></select><FieldHint>Define qué puede consultar o modificar este usuario.</FieldHint></label>
          </>
        )}
        <div className="form-page-actions">
          <button type="button" className="secondary" onClick={close}>
            Cancelar
          </button>
          <button className="primary" disabled={saving}>
            {saving ? "Guardando…" : type === "archiveClient" ? "Archivar cliente" : "Guardar"}
          </button>
        </div>
      </form>
    </section>
  );
}
function ClientSelect({
  clients,
  optional = false,
}: {
  clients: Client[];
  optional?: boolean;
}) {
  return (
    <label>
      Cliente
      <select name="clientId" required={!optional}>
        {optional && <option value="">Tarea interna</option>}
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <FieldHint>{optional ? "Elige un cliente o déjalo como tarea interna." : "Selecciona el cliente relacionado con este registro."}</FieldHint>
    </label>
  );
}
function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  const guidance = FIELD_GUIDANCE[name] || `Escribe ${label.toLowerCase()}.`;
  const example = placeholder || FIELD_EXAMPLES[name];
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={example}
        defaultValue={defaultValue}
      />
      <FieldHint>{guidance}</FieldHint>
    </label>
  );
}

const FIELD_GUIDANCE: Record<string, string> = {
  name: "Nombre completo del cliente o nombre comercial del proveedor.",
  phone: "Número con código de área; incluye código de país si es internacional.",
  email: "Correo donde la persona recibirá comunicaciones y propuestas.",
  destination: "Ciudad, país, crucero o región que desea visitar.",
  startDate: "Fecha programada de salida del viaje.",
  endDate: "Fecha programada de regreso del viaje.",
  total: "Valor total acordado del viaje, en dólares.",
  travelers: "Cantidad total de personas incluidas en la propuesta.",
  taxes: "Total de impuestos y cargos adicionales; escribe 0 si no aplica.",
  validUntil: "Último día en que el cliente puede aceptar esta cotización.",
  notes: "Información útil, preferencias, condiciones o detalles adicionales.",
  amount: "Cantidad de este cobro o pago, en dólares.",
  dueDate: "Fecha límite para completar la tarea o recibir el pago.",
  note: "Describe a qué corresponde este pago.",
  title: "Acción concreta que debe realizarse.",
  detail: "Resume lo hablado y deja claro el próximo paso.",
  firstName: "Nombre del viajero tal como aparece en su documento.",
  lastName: "Apellido del viajero tal como aparece en su documento.",
  birthDate: "Fecha de nacimiento del viajero.",
  nationality: "País de ciudadanía o nacionalidad del viajero.",
  contactName: "Persona de contacto dentro de la empresa proveedora.",
  confirmation: "Código o localizador entregado por el proveedor.",
  saleAmount: "Precio cobrado al cliente por este servicio.",
  costAmount: "Costo que la agencia pagará al proveedor.",
  commissionAmount: "Ganancia o comisión esperada para la agencia.",
  commissionDueDate: "Fecha estimada en que recibirás la comisión.",
  firstPaymentAmount: "Importe del primer pago; déjalo vacío si aún no se cobrará.",
  paymentDueDate: "Fecha límite del primer pago.",
  displayName: "Nombre que aparecerá dentro del CRM para este usuario.",
};

const FIELD_EXAMPLES: Record<string, string> = {
  name: "Ej. María González",
  phone: "Ej. +1 713 555 0184",
  email: "Ej. maria@correo.com",
  destination: "Ej. Cancún, México",
  total: "Ej. 3850.00",
  travelers: "Ej. 2",
  taxes: "Ej. 245.00",
  notes: "Ej. Prefiere habitación con vista al mar",
  amount: "Ej. 750.00",
  note: "Ej. Segundo pago del paquete",
  title: "Ej. Confirmar disponibilidad del hotel",
  detail: "Ej. Cliente aprobó el hotel; llamar mañana para cobrar",
  firstName: "Ej. María",
  lastName: "Ej. González",
  nationality: "Ej. Estadounidense",
  contactName: "Ej. Ana Pérez",
  confirmation: "Ej. HTL-847291",
  saleAmount: "Ej. 1200.00",
  costAmount: "Ej. 950.00",
  commissionAmount: "Ej. 250.00",
  firstPaymentAmount: "Ej. 500.00",
  displayName: "Ej. Carlos Rivera",
};

function FieldHint({ children }: { children: ReactNode }) {
  return <small className="field-hint">{children}</small>;
}
