# Guion de demostración — Prototipo Imprenta MMG

Cómo mostrar el flujo funcionando, con o sin n8n montado todavía.

---

## Opción rápida (sin montar nada) — mostrar la cotización de ejemplo

Abre **`demo_cotizacion_ejemplo.html`** en cualquier navegador (doble clic).
Es la cotización **real** que genera el flujo para el correo:

> *"Cotización 100 tazas y 50 lápices sublimados"*

Verás el formato idéntico al de Imprenta MMG: logo, fecha, "Tenemos el agrado de
cotizarle(s)", tabla Item/Cantidad/Valor unitario/Valor total, Neto + IVA 19% +
Valor final, datos bancarios, firma de Marta Silva Morales y pie con dirección y
teléfonos. En producción este HTML se envía como **PDF adjunto** (vía PDFShift).

**Resultado de ese pedido (verificado por el test):**

| Producto | Cantidad | Valor unitario | Valor total |
|---|---:|---:|---:|
| Taza sublimada | 100 | $2.500 | $250.000 |
| Lápiz sublimado | 50 | $350 | $17.500 |
| | | **Neto** | **$267.500** |
| | | **IVA (19%)** | **$50.825** |
| | | **Valor final** | **$318.325** |

---

## Opción completa (con n8n activo) — demo en vivo

**Preparación (una vez):** seguir el `README.md` — crear las hojas, importar
`ejemplo_lista_precios_merchandising.csv` en la pestaña de precios, conectar
credenciales.

**Guion de la demo — 3 correos de prueba:**

### 1. Merchandising automático (el "wow")
Envía a la casilla conectada un correo con asunto:
> `Cotización 100 tazas y 50 lápices sublimados`

**Qué mostrar (en < 1 min):**
- El cliente recibe la **cotización en PDF** con el formato MMG.
- El correo queda etiquetado **"Pedido recibido"** y **"Cotización enviada"**.
- Aparece una fila nueva en **Ordenes de Taller** y en **Cotizaciones Merchandising**.
- El diseñador y secretarías reciben su notificación interna.

### 2. Papelería (cotización manual)
Asunto:
> `Pedido 500 cuadernos anillados`

**Qué mostrar:**
- El cliente recibe "el encargado te contactará con la cotización" (no automática).
- El correo queda etiquetado **"Pendiente de cotizar"**.
- Se registra la OT igual, asignada al área **Librería**.

### 3. Modificación / trazabilidad
En la hoja **Ordenes de Taller**, cambia a mano el `Estado` de una OT (ej. a
`En Producción`) o la `Fecha_Entrega_Estimada`.

**Qué mostrar:**
- Se registra el cambio en **Historial de Cambios**.
- Se notifica al diseñador; si cambió la fecha, también al cliente.

---

## Qué está verificado (test automático)

El archivo de pruebas corre el **JavaScript real** de los nodos del flujo:

| Escenario | Verifica | Estado |
|---|---|---|
| Merch 2 productos | Detección, cantidades, neto/IVA/total, HTML | ✓ |
| Merch sin match en lista | No inventa precios (avisa "en camino") | ✓ |
| Papelería | Ruta manual, mensaje correcto, área correcta | ✓ |
| Acentos | "lápices" detecta keyword "lapices" | ✓ |

> Nota: el test valida la **lógica**. El envío real de correos, PDF y Sheets se
> prueba en n8n con las credenciales conectadas.

---

## Limitaciones honestas para la demo
- Solo cotiza automáticamente productos que estén en la lista de precios.
- La cantidad se infiere del texto del correo; en correos muy ambiguos la
  cotización queda en estado "revisar" antes de enviarse.
- Plan free de PDFShift: 50 PDF/mes.
