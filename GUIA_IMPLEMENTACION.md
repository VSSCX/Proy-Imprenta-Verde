# Guía de Implementación y Uso
## Sistema de Trazabilidad de Órdenes de Trabajo — Imprenta MMG / La Imprenta Verde

Documento de referencia para poner en marcha el flujo en n8n y para entender qué
hace cada parte. Pensado para entregarse junto al proyecto.

---

## 1. ¿Qué es este sistema?

Una automatización en **n8n** que recibe los pedidos de los clientes por correo,
los clasifica, genera cotizaciones de Merchandising en PDF (con el formato formal
de la imprenta), lo registra todo en Google Sheets y mantiene informado al equipo.
Incluye control diario de pedidos en proveedor externo y un módulo de WhatsApp
listo para activar en el futuro.

**Tiempo de respuesta:** revisa el correo cada ~1 minuto (casi en tiempo real).

---

## 2. Características del flujo (checklist)

### Carril 1 — Pedido nuevo (correo entrante)
- [ ] Genera un folio único por pedido: `OT-AAAAMMDD-NNN`
- [ ] Clasifica el área: Ropa, Librería, Plastificados o Merchandising
- [ ] Detección por palabras clave **insensible a acentos y mayúsculas**
- [ ] **Merchandising:** cotización **automática en PDF** con el formato de Imprenta MMG
- [ ] **Papelería:** registra y avisa que el encargado cotiza a mano (no automática)
- [ ] Registra la orden en la hoja "Ordenes de Taller"
- [ ] Notifica al diseñador del área y a secretarías
- [ ] Responde automáticamente al cliente confirmando recepción
- [ ] Etiqueta el correo: "Pedido recibido", "Cotización enviada", "Pendiente de cotizar"
- [ ] Si PDFShift falla, envía la cotización como HTML (fallback automático)

### Carril 2 — Modificación (cambios en la hoja)
- [ ] Detecta cuando alguien edita una orden en Google Sheets
- [ ] Mecanismo anti-bucle (no se dispara con las órdenes recién creadas)
- [ ] Guarda el historial del cambio en "Historial de Cambios"
- [ ] Notifica al diseñador y secretarías según el campo modificado
- [ ] Si cambia la fecha de entrega, avisa también al cliente

### Carril 3 — Control de externos
- [ ] Corre automáticamente cada día hábil a las 9:00 AM
- [ ] Detecta pedidos vencidos en proveedor externo
- [ ] Envía alerta al equipo con el detalle y días de atraso

### Carril 4 — WhatsApp (preparado, desactivado)
- [ ] Módulos listos para conectar cuando haya un WhatsApp Business
- [ ] Normaliza mensajes de WAHA / Evolution API / WhatsApp Cloud

### Robustez
- [ ] Reintentos automáticos en los nodos críticos (Sheets, Gmail, PDFShift)
- [ ] El flujo continúa aunque falle una notificación secundaria
- [ ] Logo embebido (base64) — el PDF no depende de hosting externo
- [ ] Cotización con formato idéntico al de Imprenta MMG (logo, IVA, firma, datos bancarios)

---

## 3. Requisitos previos

| Servicio | Plan | Costo aprox. | Para qué |
|----------|------|-------------|----------|
| n8n Cloud | Pro | ~USD 50/mes | Ejecuta el workflow (sin servidor propio) |
| PDFShift | Free | USD 0 (50 PDF/mes) | Convierte la cotización HTML a PDF |
| Google Workspace | — | (cuenta existente) | Gmail + Google Sheets |

---

## 4. Guía paso a paso de implementación

> Orden recomendado: crear primero el Google Sheet y las etiquetas de Gmail,
> luego importar el workflow. Así al conectar los nodos ya puedes seleccionar las
> hojas y etiquetas reales de los desplegables.

### Fase 0 — Contratación
- [ ] Contratar **n8n Cloud** (plan Pro)
- [ ] Crear cuenta en **pdfshift.io** y copiar la **API Key**

### Fase 1 — Google Sheets
- [ ] Crear un documento de Google Sheets
- [ ] Crear la pestaña **`Ordenes de Taller`** con sus 17 columnas (ver README)
- [ ] Crear la pestaña **`Historial de Cambios`** con sus 6 columnas
- [ ] Crear la pestaña **`Cotizaciones Merchandising`** con sus columnas
- [ ] Crear la pestaña **`Lista de Precios Merchandising`**
- [ ] Importar `ejemplo_lista_precios_merchandising.csv` en esa pestaña (para probar)
- [ ] Copiar el **ID del documento** (está en la URL, entre `/d/` y `/edit`)

### Fase 2 — Etiquetas de Gmail
- [ ] Crear la etiqueta **"Pedido recibido"**
- [ ] Crear la etiqueta **"Cotización enviada"**
- [ ] Crear la etiqueta **"Pendiente de cotizar"**

### Fase 3 — Credenciales en n8n
- [ ] Crear credencial **Gmail OAuth2** (autorizar la cuenta de la imprenta)
- [ ] Crear credencial **Google Sheets OAuth2**
- [ ] Crear credencial **Header Auth** para PDFShift → header `X-API-Key` = tu API Key

### Fase 4 — Importar el workflow
- [ ] En n8n: **Workflows → Import from File**
- [ ] Seleccionar `workflow_trazabilidad_imprenta_verde.json`

### Fase 5 — Conectar credenciales y reemplazar placeholders
- [ ] Asignar la credencial Gmail a todos los nodos Gmail
- [ ] Asignar la credencial Sheets a todos los nodos Google Sheets
- [ ] Asignar la credencial PDFShift al nodo "Generar PDF cotizacion (PDFShift)"
- [ ] Reemplazar `YOUR_SPREADSHEET_ID` por el ID del documento
- [ ] Reemplazar `YOUR_SHEETS_URL` por la URL completa del documento
- [ ] Seleccionar las 3 etiquetas en los nodos "Etiquetar correo..."

### Fase 6 — Correos del equipo
- [ ] Reemplazar `vsotoc@fen.uchile.cl` por las casillas reales (secretarías,
      diseñadores por área) — un find/replace o nodo por nodo

### Fase 7 — Probar (ver DEMO.md)
- [ ] Enviar correo de prueba Merchandising → llega cotización en PDF
- [ ] Enviar correo de prueba Papelería → llega aviso de cotización manual
- [ ] Editar una orden en la hoja → se registra el cambio y notifica
- [ ] Revisar que las etiquetas se apliquen en Gmail

### Fase 8 — Activar
- [ ] Poner el workflow en **"Active"** (toggle arriba a la derecha)

---

## 5. Placeholders a reemplazar (resumen)

| Placeholder | Reemplazar por |
|-------------|----------------|
| `YOUR_GMAIL_CREDENTIAL_ID` | Credencial Gmail (al elegirla en cada nodo) |
| `YOUR_SHEETS_CREDENTIAL_ID` | Credencial Google Sheets |
| `YOUR_PDFSHIFT_CREDENTIAL_ID` | Credencial Header Auth (PDFShift) |
| `YOUR_SPREADSHEET_ID` | ID del documento Google Sheets |
| `YOUR_SHEETS_URL` | URL completa del documento |
| `YOUR_LABEL_ID_PEDIDO_RECIBIDO` | Etiqueta "Pedido recibido" |
| `YOUR_LABEL_ID_COTIZACION_ENVIADA` | Etiqueta "Cotización enviada" |
| `YOUR_LABEL_ID_PENDIENTE_COTIZAR` | Etiqueta "Pendiente de cotizar" |

---

## 6. Mantención (uso diario de la imprenta)

- **Lista de precios:** mantener actualizada la pestaña "Lista de Precios
  Merchandising". Cada producto necesita: nombre, palabras clave (keywords),
  precio neto y tiempo de producción. Es la fuente de las cotizaciones automáticas.
- **Seguimiento de pedidos:** el equipo trabaja sobre la hoja "Ordenes de Taller"
  (cambiar estados, fechas, etc.). Cada cambio queda registrado y notifica.
- **Externos:** marcar el estado "En Externo" y la fecha límite de retorno para
  que el control diario los vigile.

---

## 7. Activar WhatsApp más adelante (3 pasos)

1. Habilitar los nodos "PLACEHOLDER WhatsApp Business" y "Normalizar mensaje
   WhatsApp" (quitar *Disabled*).
2. Apuntar el webhook del proveedor (WAHA / Evolution API / WhatsApp Cloud) a la
   URL del nodo Webhook.
3. (Opcional) Agregar un nodo de envío por WhatsApp para responder al cliente.

---

## 8. Cuando llegue la lista de precios real

No es necesario reformatearla. La adaptación a la estructura real de la imprenta
se hace en **2 nodos**:
- `Leer lista de precios Merchandising` (qué pestaña/columnas leer)
- `Calcular precios y generar cotizacion` (de qué columnas saca producto/keyword/precio)

Es un cambio pequeño y localizado, que se hace una vez aprobado el prototipo.

---

## 9. Datos de la imprenta (en la cotización)

- **IMPRENTA MMG S.A.** — RUT 76.281.107-3
- Banco de Chile — Cta. Cte. N° 174-06098-10
- Manuel Antonio Tocornal 1912, Santiago
- Fonos: 25548531 / 25518212 / 25513167 / 99 8188987
- imprentammg@gmail.com — www.imprentammg.cl
- Firma: Marta Silva Morales — IMPRENTA MMG

---

*Documento generado para el proyecto de automatización de Imprenta MMG /
La Imprenta Verde.*
