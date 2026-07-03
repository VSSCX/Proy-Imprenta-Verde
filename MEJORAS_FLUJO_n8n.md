# Mejoras al flujo n8n — Trazabilidad Imprenta MMG / La Imprenta Verde

Este documento resume las mejoras aplicadas al archivo
`workflow_trazabilidad_imprenta_verde.json` y **qué hay que configurar una vez**
en Google Sheets / n8n para que funcionen.

## Resumen de qué se implementó

| # | Mejora | Estado | Dónde |
|---|--------|--------|-------|
| 1 | Clasificar sobre **todo** el correo (asunto + cuerpo + adjuntos), no solo el asunto | ✅ Implementado | Nodo *Parsear correo y generar ID OT* → variable `TextoAnalisis`. El *Switch* y la clasificación de área ahora usan `TextoAnalisis`. Además el **Gmail Trigger** se abrió para que entren correos con asunto genérico (`Hola`, `Consulta`, vacío). |
| 2 | Analizar archivos adjuntos | ✅ Nombres de adjuntos / ⚠️ OCR de contenido pendiente | Se incorporan los **nombres** de los adjuntos (ej. `Pedido.pdf`) al `TextoAnalisis`. Leer el **texto interno** del PDF/DOCX (OCR) queda como extensión opcional (ver abajo). |
| 4 | Detectar **múltiples categorías** | ✅ Implementado | `Areas_Detectadas` y `Multi_Area`. El área principal se usa para enrutar; todas las áreas quedan registradas. |
| 5 | Detectar **cantidades** + producto | ✅ Implementado | `Items_Detectados` (ej. `300 tazas; 100 lanyards; 50 poleras negras`). |
| 6 | Detectar **medidas** | ✅ Implementado | `Medidas_Detectadas` (ej. `80x200; 3x2 metros`). |
| 7 | Detectar **urgencia** | ✅ Implementado | `Prioridad = Alta` + `Motivo_Prioridad`. Urgente adelanta la entrega a 1 día hábil. |
| 8 | Extraer **fechas** de entrega | ✅ Implementado | `Fecha_Solicitada` (soporta `25 de julio`, `25/07`, `viernes`, etc.). Si existe, reemplaza la fecha estimada. |
| 9 | Detectar **clientes nuevos** | ✅ Implementado | Nodo *Leer OTs existentes* + *Detectar duplicado y cliente nuevo* → `Es_Cliente_Nuevo`. El correo a secretarías muestra un aviso "⚠️ Cliente NUEVO". |
| 10 | Evitar **OT duplicadas** | ✅ Implementado | Mismo remitente + mismo asunto + mismo día ⇒ no se crea otra OT (rama *Es OT duplicada*). |
| 11 | **Historial de eventos** | ✅ Base implementada | Nuevos nodos *Log evento: OT creada / duplicada ignorada / cotización enviada* → hoja **Log de Eventos**. Ampliable a más hitos. |
| 12 | **Estados más completos** | ✅ Documentado (adoptar según necesidad) | Ver lista recomendada abajo. |
| 15 | **Manejo profesional de errores** | ✅ Implementado | Carril 5: *Captura de errores del flujo* (Error Trigger) → *Formatear error* → **Log de Errores**. |

> Los puntos 3, 13 y 14 no venían en la lista enviada.

---

## ⚙️ Configuración necesaria (una sola vez)

### 1. Nuevas columnas en la hoja **"Ordenes de Taller"**
Agregar estos encabezados (el nodo los completa automáticamente; si no existen,
n8n los crea al final):

`Prioridad`, `Items_Detectados`, `Medidas_Detectadas`, `Fecha_Solicitada`,
`Es_Cliente_Nuevo`, `Areas_Detectadas`

### 2. Nueva pestaña **"Log de Eventos"**
Columnas: `Fecha_Hora`, `ID_OT`, `Evento`, `Detalle`

### 3. Nueva pestaña **"Log de Errores"**
Columnas: `Fecha_Hora`, `Nodo`, `ID_OT`, `Tipo_Error`, `Mensaje`, `Accion`

### 4. Activar el manejo de errores
En n8n: **Settings del workflow → Error Workflow →** seleccionar **este mismo
workflow**. Así el nodo *Captura de errores del flujo* recibe cualquier fallo y
lo registra en *Log de Errores*.

### 5. Adjuntos
El Gmail Trigger ya trae `downloadAttachments: true` para poder leer los
nombres de archivo. No requiere acción adicional.

---

## Estados recomendados (mejora 12)

Reemplazar el ciclo corto (`Recibido → En Diseño → Terminado`) por un conjunto
más informativo. No es obligatorio usarlos todos:

```
Recibido
Pendiente de revisión
Esperando información del cliente
En cotización
Cotización enviada
Cotización aceptada
En diseño
En producción
En externo
Control de calidad
Listo para retiro
Despachado
Entregado
Facturado
Cerrado
```

---

## Extensión opcional: OCR / lectura de PDF adjunto (mejora 2 completa)

Hoy se usan los **nombres** de los adjuntos. Para leer el **contenido** de un
`Pedido.pdf` y clasificar con esa información:

1. En el Gmail Trigger ya está `downloadAttachments: true`.
2. Insertar un nodo **Extract from File** (`extractFromFile`, operación *PDF*)
   entre el trigger y el parser, sobre la propiedad binaria del adjunto.
3. En el parser, concatenar ese texto extraído a `TextoAnalisis`.

Se deja como paso opcional porque un PDF **escaneado** (imagen) requiere un
servicio OCR externo (ej. Google Vision / Tesseract), lo que agrega costo y
complejidad fuera del enfoque no-code de bajo costo del proyecto.

---

## Validación

- JSON válido (`python3 -m json.tool`).
- IDs de nodo únicos, todas las conexiones resuelven a nodos existentes.
- Todos los nodos *Code* pasan `node --check`.
- Parser probado contra los ejemplos del pedido (asunto genérico con items en el
  cuerpo, adjunto sin cuerpo, urgencia + fecha, medidas, día de la semana).
