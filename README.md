# Sistema de Trazabilidad de Órdenes de Trabajo — Imprenta MMG / La Imprenta Verde

Automatización en **n8n** que recibe pedidos por correo, los clasifica, genera
cotizaciones automáticas de Merchandising en PDF (con el formato formal de la
imprenta), registra todo en Google Sheets y notifica al equipo. Incluye control
diario de pedidos en proveedor externo y un módulo de WhatsApp listo para activar.

![Logo](Imprenta_MMG-removebg-preview.png)

---

## ¿Qué hace? (4 carriles)

| Carril | Disparador | Función |
|--------|-----------|---------|
| **1 — Pedido nuevo** | Correo entrante (Gmail) | Genera folio `OT-AAAAMMDD-NNN`, detecta el área y la línea de negocio, registra la OT en Sheets, notifica al diseñador y a secretarías, y responde al cliente. |
| **2 — Modificación** | Edición en la hoja "Ordenes de Taller" | Guarda el historial del cambio y avisa a los afectados. La columna `_Sistema_Flag` y el estado `Recibido` evitan bucles. |
| **3 — Control externo** | Cada día hábil a las 9:00 AM | Detecta pedidos que debían volver del proveedor externo y no lo hicieron; envía alerta. |
| **4 — WhatsApp** | Webhook (desactivado) | Listo para conectar cuando la imprenta tenga un número de WhatsApp Business. |

### Líneas de negocio
- **Papelería:** se registra la consulta y se avisa al cliente que el encargado
  enviará la cotización manualmente. **No** se cotiza de forma automática.
- **Merchandising:** se busca el producto en la lista de precios y, si existe, se
  genera una **cotización formal en PDF** (vía PDFShift) y se envía al cliente.
  Si el producto no está en la lista, se avisa que la cotización llega pronto.

---

## Requisitos

| Servicio | Plan | Costo aprox. | Para qué |
|----------|------|-------------|----------|
| **n8n Cloud** | Pro | ~USD 50/mes | Ejecuta el workflow (no requiere servidor propio). |
| **PDFShift** | Free | USD 0 (50 PDF/mes) | Convierte la cotización HTML a PDF. |
| **Google Workspace** | — | (cuenta existente) | Gmail + Google Sheets. |

---

## Instalación paso a paso

### 1. Crear las hojas de Google Sheets
Crea **un** documento de Google Sheets con estas **4 pestañas** (los nombres deben
ser exactos) y la **primera fila** con estos encabezados:

**`Ordenes de Taller`**
```
ID_OT | Fecha_Ingreso | Cliente | Email_Cliente | Asunto_Pedido | Area |
Disenador_Asignado | Estado | Fecha_Entrega_Estimada | Va_A_Externo |
Proveedor_Externo | Fecha_Limite_Retorno | Fecha_Retorno_Real |
Modalidad_Despacho | Notas | Fecha_Cierre | _Sistema_Flag
```

**`Historial de Cambios`**
```
ID_OT | Fecha_Cambio | Campo_Modificado | Valor_Anterior | Valor_Nuevo | Notas_Cambio
```

**`Cotizaciones Merchandising`**
```
N_Cotiz | ID_OT | Fecha_Formal | Cliente | Atencion | Email_Cliente |
Descripcion_Proyecto | Producto_1 | Cantidad_1 | ValorUnit_1 | Subtotal_1 |
Producto_2 | Cantidad_2 | ValorUnit_2 | Subtotal_2 |
Producto_3 | Cantidad_3 | ValorUnit_3 | Subtotal_3 |
Producto_4 | Cantidad_4 | ValorUnit_4 | Subtotal_4 |
Producto_5 | Cantidad_5 | ValorUnit_5 | Subtotal_5 |
Subtotal_General | IVA_19 | Total | Plazo_Produccion | Modalidad_Entrega |
Estado_Cotiz | Notas_Cotiz
```

**`Lista de Precios Merchandising`** — la mantiene la imprenta con precios al día:
```
Producto | Keywords | Precio_Unitario_Neto | Tiempo_Produccion
```
- `Keywords`: palabras separadas por coma que aparecen en los correos
  (ej. `taza,tazon,mug`). El sistema busca estas palabras en el asunto/cuerpo.
- `Precio_Unitario_Neto`: valor neto en CLP (ej. `2500`).

### 2. Crear credenciales en n8n
- **Gmail OAuth2** → "Gmail - La Imprenta Verde"
- **Google Sheets OAuth2** → "Google Sheets - La Imprenta Verde"
- **Header Auth** (para PDFShift) → "PDFShift API Key"
  - Nombre del header: `X-API-Key`
  - Valor: tu API key de [pdfshift.io](https://pdfshift.io) (plan free)

### 3. Importar el workflow
En n8n: **Workflows → Import from File →** `workflow_trazabilidad_imprenta_verde.json`

### 4. Reemplazar los placeholders
Al importar, conecta cada nodo a su credencial. Quedan estos textos por reemplazar:

| Placeholder | Reemplazar por | Dónde |
|-------------|----------------|-------|
| `YOUR_GMAIL_CREDENTIAL_ID` | Credencial Gmail | Se asigna al elegir la credencial en cada nodo Gmail |
| `YOUR_SHEETS_CREDENTIAL_ID` | Credencial Sheets | Nodos de Google Sheets |
| `YOUR_PDFSHIFT_CREDENTIAL_ID` | Credencial Header Auth | Nodo "Generar PDF cotizacion (PDFShift)" |
| `YOUR_SPREADSHEET_ID` | ID del documento Sheets | El ID está en la URL del Sheets, entre `/d/` y `/edit` |
| `YOUR_SHEETS_URL` | URL completa del Sheets | Aparece en los enlaces "Ver en Google Sheets" de los correos |

> El **logo** ya viene embebido en base64 dentro del workflow — no requiere hosting.

### 5. Correos del equipo
Para **pruebas**, todas las notificaciones internas están dirigidas a
`vsotoc@fen.uchile.cl`. En **producción**, reemplaza esa dirección por las casillas
reales (secretarías, diseñadores por área, etc.). Es un único find/replace en el JSON
o editable nodo por nodo.

---

## Probar el flujo
1. Envíate un correo a la casilla de Gmail conectada con asunto, p. ej.,
   `Cotización 100 tazas` (`is:unread` y que contenga una palabra clave).
2. En < 1 min deberías recibir: la respuesta al cliente, la notificación al
   diseñador, el aviso a secretarías y —si "taza" está en la lista de precios—
   la **cotización en PDF**.
3. Revisa que la fila se haya creado en "Ordenes de Taller".

---

## Activar WhatsApp más adelante (3 pasos)
1. Habilitar los nodos "PLACEHOLDER WhatsApp Business" y "Normalizar mensaje
   WhatsApp" (quitar *Disabled*).
2. Apuntar el webhook del proveedor (WAHA / Evolution API / WhatsApp Cloud) a la
   URL del nodo Webhook.
3. (Opcional) Agregar un nodo de envío por WhatsApp para responder al cliente; las
   notificaciones internas ya funcionan.

---

## Datos de la imprenta (en la cotización)
- **IMPRENTA MMG S.A.** — RUT 76.281.107-3
- Banco de Chile — Cta. Cte. N° 174-06098-10
- Manuel Antonio Tocornal 1912, Santiago
- Fonos: 25548531 / 25518212 / 25513167 / 99 8188987
- imprentammg@gmail.com — www.imprentammg.cl
- Firma: Marta Silva Morales — IMPRENTA MMG

---

## Archivos del repositorio
| Archivo | Descripción |
|---------|-------------|
| `workflow_trazabilidad_imprenta_verde.json` | Workflow completo de n8n (importar este). |
| `Imprenta_MMG-removebg-preview.png` | Logo original (ya embebido en el JSON). |
| `.claude/commands/n8n.md` | Guía/skill de patrones n8n para mantención. |
