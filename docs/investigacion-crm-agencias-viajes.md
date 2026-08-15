# Investigación de producto: CRM para agencias de viajes

Fecha de corte: 14 de agosto de 2026

## 1. Resumen ejecutivo

Un CRM para agencias de viajes no debe diseñarse alrededor de un embudo genérico de ventas. La entidad central es el **viaje**, que relaciona una oportunidad comercial con uno o varios viajeros, versiones de una propuesta, servicios reservados con distintos proveedores, vencimientos, documentos, pagos, costos y comisiones.

La oportunidad más defendible es construir un sistema sencillo para agencias emisoras pequeñas y medianas que hoy coordinan el trabajo entre WhatsApp, correo, hojas de cálculo, PDFs, calendarios y portales de proveedores. El producto debe reducir tres pérdidas concretas: seguimientos olvidados, errores de operación y comisiones no cobradas.

La propuesta recomendada es:

> Un espacio de trabajo para vender y operar viajes de principio a fin: captar la solicitud, perfilar a los viajeros, cotizar opciones, recibir aprobación, controlar reservas y vencimientos, centralizar conversaciones y documentos, conciliar pagos y comisiones, y acompañar al cliente antes, durante y después del viaje.

El MVP no debería emitir vuelos ni custodiar números de tarjeta. Tampoco debería comenzar como contabilidad completa. Debe registrar reservas hechas en sistemas externos, aceptar importaciones y enlaces, utilizar páginas de pago alojadas por un procesador, y mantener una bitácora financiera operativa que posteriormente pueda sincronizarse con contabilidad.

## 2. Segmento inicial recomendado

### Cliente ideal

- Agencia vacacional/emisora de 2 a 25 asesores.
- Vende viajes a medida, lunas de miel, vacaciones familiares, circuitos, cruceros o grupos pequeños.
- Opera principalmente por WhatsApp y correo.
- Hace reservas en portales de mayoristas, consolidadores, aerolíneas, hoteles y operadores.
- Controla tareas, anticipos, saldos y comisiones en hojas de cálculo.
- Necesita una solución en español, multidivisa, adaptable a la marca de la agencia y fácil de adoptar.

Este segmento tiene dolor suficiente y un proceso común, pero no exige desde el primer día la complejidad de una TMC corporativa, un gran tour operador con cupos ni una agencia receptiva con operación terrestre intensiva.

### Segmentos que conviene posponer

- **Viajes corporativos:** políticas de viaje, centros de costo, aprobaciones jerárquicas, duty of care, reportes y conciliación empresarial.
- **Tour operador:** salidas fijas, inventario/cupos, allotments, rooming lists, contratos de tarifa, costeo masivo y pagos a guías/proveedores.
- **DMC/receptivo:** logística diaria, recursos, vehículos, guías, órdenes de servicio y coordinación en destino.
- **Host agency/red de asesores:** subagencias, reparto de comisiones, cumplimiento, estados de cuenta y permisos jerárquicos adicionales.

La arquitectura debe admitirlos a futuro, pero mezclar todos sus flujos en el MVP produciría un sistema difícil de aprender.

## 3. Usuarios y trabajos que necesitan resolver

### Dueño o gerente

- Ver ventas, margen estimado, pagos pendientes, comisiones por cobrar y carga del equipo.
- Detectar viajes en riesgo y oportunidades sin seguimiento.
- Configurar procesos, permisos, plantillas, metas y fuentes de leads.
- Medir conversión, tiempo de respuesta, valor por viaje, recompra y proveedores más rentables.

### Asesor de viajes

- Responder rápidamente a una consulta con todo el contexto disponible.
- Recopilar preferencias y datos de cada viajero una sola vez.
- Preparar y versionar propuestas sin rehacer documentos.
- Obtener decisiones, firmas y anticipos.
- Saber qué vence hoy: tarifa, depósito, saldo, visa, pasaporte, check-in o cancelación.
- Reutilizar itinerarios, contenidos y listas de tareas.

### Operaciones/administración

- Confirmar que cada servicio esté reservado, pagado y documentado.
- Conciliar lo cobrado al cliente contra lo pagado al proveedor.
- Controlar reembolsos, cancelaciones, notas de crédito y diferencias de cambio.
- Reclamar y conciliar comisiones.
- Exportar información limpia a contabilidad.

### Viajero principal y acompañantes

- Completar formularios seguros sin repetir datos.
- Comparar opciones, comentar y aprobar.
- Firmar términos y pagar desde móvil.
- Consultar itinerario, documentos, saldos y contactos de emergencia.
- Recibir recordatorios relevantes, no mensajes duplicados.

## 4. Flujo operativo de extremo a extremo

1. **Captación:** web, recomendación, teléfono, WhatsApp, correo, redes o carga manual.
2. **Calificación:** destino, fechas, flexibilidad, viajeros, presupuesto, origen, motivo, preferencias y urgencia.
3. **Descubrimiento:** formulario y conversación; consentimiento y aceptación de política de privacidad.
4. **Diseño/cotización:** una o más opciones, componentes, costo, precio, margen, moneda, vigencia y condiciones.
5. **Revisión:** comentarios centralizados, versiones y decisión explícita del cliente.
6. **Compromiso:** términos, firma, tarifa de planeación si existe y/o anticipo.
7. **Reserva:** localizadores y confirmaciones por servicio; proveedor, estado, fecha límite y política de cancelación.
8. **Preparación:** documentos, seguro, requisitos migratorios, pagos finales, nombres, asientos, comidas y check-in.
9. **Viaje:** itinerario móvil, avisos, contactos y gestión de incidencias.
10. **Cierre:** reembolsos pendientes, comisión esperada/recibida, margen real y archivo.
11. **Retención:** encuesta, reseña, recomendación, aniversario y siguiente oportunidad.

El estado comercial y el estado operativo deben ser distintos. Una venta puede estar “ganada” mientras algunos servicios siguen pendientes; un viaje puede cancelarse con reembolso parcial y comisiones todavía abiertas.

## 5. Capacidades del producto

### P0 — imprescindibles para el MVP

#### Organización y seguridad multiagencia

- Organizaciones aisladas (multi-tenant), usuarios, equipos y roles.
- Roles base: propietario, gerente, asesor, operaciones y solo lectura.
- Registro de auditoría para cambios sensibles.
- Zona horaria, idioma, moneda base, marca y numeración configurables.

#### Contactos, viajeros y relaciones

- Persona, empresa/hogar y relaciones: pareja, padre, hijo, asistente, viajero frecuente.
- Datos de contacto, preferencias, restricciones alimentarias, accesibilidad y programas de lealtad.
- Historial de viajes, valor acumulado, fuente, etiquetas, consentimiento y preferencias de comunicación.
- Pasaporte/documento como módulo de alta seguridad, con acceso granular, cifrado, caducidad y registro de consulta.
- Detección y fusión de duplicados.

#### Leads y oportunidades

- Bandeja de solicitudes y pipeline configurable.
- Responsable, prioridad, origen, próxima acción, probabilidad, valor estimado y motivo de pérdida.
- SLA de primera respuesta y alertas por inactividad.
- Conversión de oportunidad a viaje sin volver a capturar información.

#### Viajes y tablero operativo

- Viaje con viajeros, asesor, destino, fechas, moneda, presupuesto y estados comercial/operativo.
- Línea de tiempo unificada de mensajes, notas, tareas, archivos, propuestas, pagos y cambios.
- Checklist basado en plantilla y fechas relativas a salida/regreso.
- Vista “hoy”: tareas vencidas, vencimientos de opción/tarifa, pagos, documentos y salidas próximas.

#### Propuestas e itinerarios

- Constructor por días y componentes: vuelo, alojamiento, traslado, actividad, crucero, tren, coche, seguro y elemento libre.
- Varias opciones y versiones; precio por persona, total, incluidos/no incluidos, vigencia y condiciones.
- Contenido reutilizable y branding.
- Vista móvil/web y PDF.
- Aprobación explícita por componente u opción, comentarios y bitácora de fecha/IP.

#### Reservas y proveedores

- Registro manual/importado de localizador, proveedor, fechas, costo, precio, moneda, estado, vencimientos y política.
- Adjuntar confirmación o reenviar correo para procesarlo posteriormente.
- Directorio de proveedores y contactos.
- No mostrar localizadores o datos sensibles a usuarios sin permiso.

#### Pagos y conciliación operativa

- Plan de pagos: depósito, cuotas, saldo final y pagos personalizados.
- Enlace a checkout alojado; webhooks para actualizar estado.
- Registro de transferencias, efectivo u otros pagos externos con evidencia.
- Reembolsos parciales/totales y estado de disputa.
- Separar `payment_due`, `payment_attempt`, `payment`, `refund` y `supplier_payment`; no reducirlos a un único campo “pagado”.
- Balance del cliente y balance con proveedores por viaje.

#### Comunicación y automatización básica

- Correo conectado o, en una primera versión, envío desde el sistema con respuestas asociadas al viaje.
- Plantillas con variables.
- Recordatorios automáticos de formularios, aprobación, pagos y tareas.
- Registro de actividad y control de exclusión comercial.
- Enlaces profundos para iniciar WhatsApp; integración oficial bidireccional en una fase posterior.

#### Reportes esenciales

- Pipeline por etapa/origen/asesor.
- Viajes por salida y estado.
- Ventas y margen estimado/real.
- Cuentas por cobrar del cliente, obligaciones con proveedor y comisiones por cobrar.
- Exportación CSV/XLSX y filtros guardados.

### P1 — después de validar el MVP

- Bandeja de correo sincronizada y asociación automática de confirmaciones.
- WhatsApp Business Platform: plantillas, opt-in, webhooks y asignación de conversación.
- Formularios condicionales y firma electrónica avanzada.
- Portal del viajero con documentos, pagos e itinerario offline.
- Importación inteligente de PDFs/correos y extracción de segmentos con revisión humana.
- Biblioteca de productos/proveedores, clonación de itinerarios y costeo más rápido.
- Comisiones: reglas por proveedor/asesor, fecha prevista, recepción y reparto.
- Integración contable y facturación electrónica según país.
- Calendario Google/Microsoft, almacenamiento externo y webhooks/API pública.
- Multiidioma y conversión de moneda con tasa fijada por operación.

### P2 — expansión

- Inventario, cupos, salidas fijas, habitaciones y lista de espera.
- Integración GDS/NDC, consolidadores y motores de reserva.
- Cambios e incidencias durante el viaje con notificaciones en tiempo real.
- Portal de proveedor y órdenes de servicio.
- Marketing segmentado, recompra y recomendaciones asistidas.
- Aplicación móvil nativa si el uso real lo justifica.

## 6. Modelo de datos recomendado

El modelo debe conservar historial y evitar datos financieros calculados de forma destructiva.

```text
Organization
 ├─ User / Team / Role
 ├─ Contact ─ Relationship ─ Contact
 │   ├─ TravelerProfile
 │   ├─ LoyaltyAccount
 │   ├─ IdentityDocument (vault/cifrado)
 │   └─ Consent
 ├─ Lead → Opportunity → Trip
 │                    ├─ TripTraveler → Contact
 │                    ├─ Proposal → ProposalVersion → ProposalItem
 │                    ├─ Booking → BookingSegment → Supplier
 │                    ├─ Task / Note / Message / File
 │                    ├─ Invoice / PaymentSchedule
 │                    ├─ Payment / Refund / SupplierPayment
 │                    └─ CommissionReceivable
 ├─ WorkflowTemplate / AutomationRun
 └─ AuditEvent
```

Decisiones importantes:

- Contacto y viajero no son sinónimos: una persona puede ser comprador, viajero, ambos o ninguno.
- Un viaje admite varios pagadores y cada pago puede cubrir partidas o viajeros distintos.
- Precio de venta, costo, impuesto, tarifa de servicio, comisión y margen son conceptos separados.
- Guardar importe y moneda originales, tasa aplicada y equivalente en moneda base.
- Las propuestas son inmutables después de enviarse; una modificación crea versión.
- Los estados deben tener transiciones auditadas, no depender de texto libre.
- Los archivos se guardan fuera de la base de datos, con metadatos, antivirus, URLs firmadas y política de retención.

## 7. Arquitectura propuesta

Para el inicio conviene un **monolito modular** con trabajos asíncronos, no microservicios. Los límites funcionales pueden ser: identidad/tenant, CRM, ventas, viajes, catálogo, propuestas, reservas, finanzas operativas, comunicación, automatización, archivos y analítica.

Componentes:

- Aplicación web responsive y portal público autenticado por enlace de un solo uso o cuenta.
- API transaccional con autorización por organización y por recurso.
- PostgreSQL con `organization_id` obligatorio y controles de aislamiento; almacenamiento de objetos para archivos.
- Cola de trabajos para correo, PDF, webhooks, importación y automatizaciones.
- Motor de plantillas y generador de PDF.
- Adaptadores para proveedores externos; ningún proveedor debe contaminar el modelo de dominio.
- Registro de eventos/outbox para webhooks confiables e integraciones posteriores.
- Observabilidad: logs estructurados sin secretos, métricas, trazas, alertas y seguimiento de errores.

No hace falta event sourcing completo. Sí hacen falta eventos de auditoría inmutables, idempotencia en pagos/webhooks, versionado de propuestas y un libro de movimientos financieros que no se sobrescriba.

## 8. Seguridad, privacidad y cumplimiento

Las agencias manejan pasaportes, fechas de nacimiento, itinerarios, contactos, necesidades médicas y datos financieros. Una filtración puede permitir fraude e incluso revelar cuándo una persona estará fuera de casa.

Controles mínimos:

- MFA para personal; sesiones revocables y protección contra fuerza bruta.
- RBAC y verificación de tenant en cada consulta; pruebas automáticas de aislamiento.
- TLS, cifrado en reposo y cifrado a nivel de campo para documentos de identidad.
- Acceso temporal y auditado a pasaportes; ocultamiento por defecto.
- Gestor de secretos, rotación, copias cifradas y recuperación probada.
- Antivirus, límites de tipo/tamaño y URLs firmadas para archivos.
- Retención configurable, eliminación/exportación por persona y bloqueo legal cuando proceda.
- Consentimiento versionado, propósito de uso y prueba de opt-in por canal.
- Separación entre mensajes transaccionales y marketing.
- Revisión humana de cualquier extracción o recomendación por IA; no entrenar modelos con datos del cliente por defecto.

Para tarjetas, la estrategia recomendada es **checkout alojado/tokenización del proveedor**. PCI DSS prohíbe conservar el CVV después de la autorización, incluso cifrado. Externalizar el procesamiento reduce el alcance, pero la agencia mantiene deberes de validación y supervisión del proveedor. El CRM no debe aceptar tarjetas por campos propios, correo, chat, notas ni archivos.

La definición del comerciante registrado es una decisión de negocio, no solo técnica. Si cada agencia cobra directamente a su cliente, un modelo SaaS con cargos directos suele aislar mejor comisiones, reembolsos y contracargos. Si la plataforma cobra y reparte fondos, asume obligaciones y riesgo considerablemente mayores.

La legislación aplicable depende de dónde operen la plataforma, la agencia y el viajero. Como mínimo, el diseño debe soportar minimización, finalidad, transparencia, exactitud, retención limitada, seguridad y ejercicio de derechos. La Comisión Europea usa expresamente una agencia de viajes como ejemplo de estos principios del GDPR.

## 9. Integraciones: estrategia y límites

### Prioridad alta

1. Correo y calendario.
2. Procesador de pagos con checkout alojado, reembolsos y webhooks.
3. Almacenamiento/archivos y firma.
4. WhatsApp Business Platform, después de resolver consentimiento, plantillas y asignación multiagente.
5. Contabilidad/facturación del mercado inicial.

### Distribución y reservas

IATA NDC es un estándar abierto de mensajes de Offers & Orders entre aerolíneas y distribuidores, pero no equivale a una única API universal con acceso comercial automático. Amadeus Self-Service permite búsqueda y ciertos flujos de reserva, pero documenta exclusiones de aerolíneas/tarifas y exige consolidador o certificación para emisión según el escenario.

Por ello, el MVP debe:

- Capturar reservas manualmente con rapidez.
- Importar confirmaciones estructuradas/semiestructuradas.
- Permitir enlaces externos y localizadores.
- Definir un esquema canónico de segmentos.
- Agregar conectores solo cuando clientes piloto confirmen volumen y proveedor concreto.

Intentar cubrir Amadeus, Sabre, Travelport, NDC directo, mayoristas, hoteles, tours y cruceros a la vez retrasaría el producto sin garantizar contenido ni derechos de reserva.

## 10. Competencia y espacios de diferenciación

### Plataformas observadas

- **TravelJoy:** CRM, propuestas/itinerarios, grupos, pagos, autorizaciones y automatizaciones; enfatiza una experiencia todo en uno.
- **Travefy:** fuerte en itinerarios, formularios, tareas y CRM; en 2025 añadió facturas, seguimiento de comisiones y correo integrado.
- **Tern:** producto moderno para asesores; en 2026 destaca clasificación de correo, extracción de reservas y consultas de IA sobre notas/CRM.
- **TRES / ClientBase / Trams:** profundidad de front, mid y back office, contabilidad y comisiones; representa el estándar funcional de agencias maduras.
- **WeTravel:** muy fuerte para viajes de varios días y grupos: checkout, cuotas, inventario, manifiestos, pagos multidivisa y pagos a proveedores.
- **CRM genérico:** excelente flexibilidad comercial e integraciones, pero obliga a ensamblar propuesta, viaje, viajeros, reservas y comisiones fuera del modelo nativo.

### Tabla de posicionamiento

| Alternativa | Fortaleza | Hueco aprovechable |
|---|---|---|
| CRM genérico | Pipeline, marketing, ecosistema | No entiende viaje, reserva, viajero ni comisión |
| CRM vertical de asesor | Simplicidad e itinerarios | Localización fiscal/pagos y operación de equipo pueden variar por región |
| Back office tradicional | Contabilidad, GDS, comisiones | Experiencia, adopción y colaboración con cliente |
| Plataforma de grupos | Cobro, inventario y participantes | Relación de largo plazo y viaje a medida |
| Hojas + WhatsApp + PDF | Flexibles y conocidas | Errores, duplicación, falta de trazabilidad y métricas |

### Diferenciación recomendada

No competir por “tener CRM + itinerarios”; ya es el mínimo del mercado. La cuña debe combinar:

- Experiencia excelente en español y móvil/WhatsApp.
- Tablero operativo que previene vencimientos y errores.
- Finanzas operativas transparentes: costo, margen, saldos y comisiones por viaje.
- Implementación rápida con importación desde hojas y plantillas preconfiguradas.
- Adaptación fiscal y de pagos al mercado inicial.
- Automatización explicable con revisión humana, especialmente al leer confirmaciones.

## 11. MVP propuesto y fases

### Fase 0 — descubrimiento (3–4 semanas)

- Entrevistar 12–15 personas de al menos 6 agencias del segmento elegido.
- Observar en pantalla cómo procesan tres casos reales: viaje individual, familia y cancelación.
- Recopilar plantillas anonimizadas de lead, cotización, confirmación, control de pagos y comisiones.
- Medir frecuencia y costo de los problemas, no solo preferencias declaradas.
- Elegir un país inicial y decidir comerciante registrado, factura y procesador antes de programar pagos.

### Fase 1 — MVP piloto (10–14 semanas, equipo pequeño experimentado)

- Organización, roles, contactos/relaciones y leads.
- Viajes, viajeros, timeline, tareas y vencimientos.
- Propuestas versionadas con vista web/PDF y aprobación.
- Reservas/proveedores manuales.
- Plan de pagos, checkout alojado y pagos externos.
- Plantillas de correo y recordatorios.
- Dashboard operativo y reportes básicos.
- Importación CSV, auditoría, backups y controles de seguridad esenciales.

### Fase 2 — operación conectada

- Correo/calendario bidireccional.
- WhatsApp oficial.
- Portal de viajero mejorado.
- Comisiones y conciliación avanzada.
- Extracción asistida de confirmaciones.
- Integración contable/fiscal del país inicial.

### Fase 3 — expansión vertical

- Elegir una sola: grupos/inventario, corporativo, DMC o red de asesores.
- Añadir conectores de reserva respaldados por demanda y acuerdos comerciales.

## 12. Métricas de éxito

### North Star sugerida

**Viajes activos gestionados sin vencimientos críticos omitidos.** Combina adopción con el resultado operativo; debe acompañarse de métricas de calidad para evitar que el equipo simplemente marque tareas.

### Activación

- Tiempo hasta primer contacto importado, primera propuesta enviada y primer viaje confirmado.
- Porcentaje que completa configuración e importa datos durante la primera semana.

### Valor operativo

- Minutos para crear/enviar una propuesta.
- Porcentaje de viajes con próximo paso y checklist completo.
- Vencimientos críticos omitidos por 100 viajes.
- Porcentaje de confirmaciones y pagos conciliados.
- Comisiones vencidas/no cobradas y días hasta conciliación.

### Comercial y retención

- Tiempo de primera respuesta.
- Conversión solicitud → propuesta → reserva.
- Duración del ciclo y motivos de pérdida.
- Recompra, recomendación, viajes activos por asesor y retención de agencias.

## 13. Riesgos principales

1. **Alcance demasiado amplio:** resolver con segmento y país inicial explícitos.
2. **Adopción:** importación, onboarding acompañado y valor visible el primer día.
3. **Datos sensibles:** vault, privilegio mínimo, auditoría y retención; nunca tarjeta en notas.
4. **Complejidad financiera:** libro de movimientos, monedas y estados separados; no prometer contabilidad completa.
5. **Integraciones frágiles:** adaptadores, webhooks idempotentes, reconciliación y operación manual de respaldo.
6. **Automatizaciones dañinas:** simulación, historial, límites, aprobación y botón de pausa.
7. **Dependencia de IA:** toda extracción debe mostrar fuente/confianza y solicitar revisión antes de afectar reservas o dinero.
8. **Datos de requisitos de viaje:** no presentarlos como asesoría garantizada; mostrar fuente, fecha de consulta y recomendación de verificación oficial.

## 14. Preguntas que deben cerrarse antes de construir

1. ¿En qué país se venderá primero y en cuáles operan las agencias?
2. ¿Agencia emisora, tour operador, DMC, corporativa o red de asesores?
3. ¿Tamaño típico del equipo y volumen mensual de viajes/viajeros?
4. ¿Qué tres hojas/documentos usan hoy y cuál causa más errores?
5. ¿Quién cobra: agencia, proveedor o plataforma? ¿Se cobran honorarios de planeación?
6. ¿Qué monedas, impuestos y factura electrónica se requieren?
7. ¿Qué canales generan y cierran la mayoría de las ventas?
8. ¿Qué sistemas de reservas/proveedores concentran al menos 70% del volumen?
9. ¿Necesitan guardar pasaportes o basta pedirlos y compartirlos temporalmente?
10. ¿El primer producto será interno para una agencia o SaaS para muchas agencias?

## 15. Recomendación final

Construir primero el sistema operativo comercial y de ejecución del viaje, no un motor universal de reservas. El producto debe ganar confianza al asegurar que cada consulta tenga seguimiento, cada propuesta tenga decisión, cada reserva tenga vencimiento, cada pago tenga conciliación y cada comisión tenga cierre.

Antes de decidir stack o pantallas, se debe completar Fase 0 con casos reales del mercado inicial. Si las entrevistas confirman que WhatsApp, propuestas y control financiero son los tres cuellos de botella, el MVP descrito ofrece una secuencia coherente y vendible.

## Fuentes consultadas

- [IATA — Distribution with Offers & Orders (NDC)](https://www.iata.org/en/programs/airline-distribution/retailing/ndc/)
- [Amadeus for Developers — API FAQ y limitaciones](https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/)
- [Amadeus for Developers — acceso a producción y emisión](https://developers.amadeus.com/self-service/apis-docs/guides/developer-guides/API-Keys/moving-to-production/)
- [PCI SSC — prohibición de almacenar CVV](https://www.pcisecuritystandards.org/faqs/1280/)
- [PCI SSC — obligaciones aun al externalizar procesamiento](https://www.pcisecuritystandards.org/faqs/does-pci-dss-apply-to-merchants-who-outsource-all-payment-processing-operations-and-never-store-process-or-transmit-cardholder-data/)
- [Comisión Europea — principios GDPR, ejemplo de agencia de viajes](https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/principles-gdpr/overview-principles/what-data-can-we-process-and-under-which-conditions_en)
- [Stripe — diferencias entre SaaS y marketplace/merchant of record](https://docs.stripe.com/connect/saas-platforms-and-marketplaces)
- [Stripe — tipos de cargos Connect y responsabilidad](https://docs.stripe.com/connect/charges)
- [TravelJoy — plataforma y capacidades](https://traveljoy.com/)
- [TravelJoy — grupos, automatización, pagos y CRM](https://traveljoy.com/blog/post/traveljoy-features-that-simplify-travel-planning-for-advisors)
- [Travefy — lanzamiento del CRM integrado en 2025](https://travefy.com/blog-post/travefy-launches-all-new-crm-suite)
- [Travefy — CRM, formularios, autorizaciones y facturas](https://go.travefy.com/crm)
- [Tern — novedades de producto Q1 2026](https://help.tern.travel/en/articles/14141693-what-we-launched-at-the-q1-2026-webinar)
- [TRES — visión general de CRM, contabilidad y mid-office](https://trestechnologieshelp.zendesk.com/hc/en-us/articles/4414961155603-Tres-Overview)
- [TRES Technologies — productos front/mid/back office](https://www.trestechnologies.com/products)
- [WeTravel — operación de reservas, pagos y proveedores](https://help.wetravel.com/en/articles/253921-how-it-works)
- [WeTravel — CRM, itinerarios, pagos e inventario](https://www.wetravel.com/)

