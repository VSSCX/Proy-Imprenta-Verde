const fs = require('fs');

// Cargar workflow y extraer el jsCode real de cada Code node
const wf = JSON.parse(fs.readFileSync('workflow_trazabilidad_imprenta_verde.json','utf8'));
const byName = {};
wf.nodes.forEach(n => byName[n.name] = n);
const codeOf = name => byName[name].parameters.jsCode;

// ── Mock del entorno n8n ────────────────────────────────────────────────────
function runCode(jsCode, inputItems, refMap) {
  const $input = {
    first: () => inputItems[0],
    all: () => inputItems,
    last: () => inputItems[inputItems.length-1],
  };
  const $ = (nodeName) => {
    const items = (refMap && refMap[nodeName]) || [];
    return {
      first: () => items[0],
      all: () => items,
      get item() { return items[0]; },
    };
  };
  const fn = new Function('$input', '$', jsCode);
  return fn($input, $);
}

// Cargar lista de precios de ejemplo (CSV -> rows como las daría Google Sheets)
const csv = fs.readFileSync('ejemplo_lista_precios_merchandising.csv','utf8').trim().split('\n');
const headers = csv[0].split(',');
function parseCsvLine(line){
  const out=[]; let cur=''; let q=false;
  for(const ch of line){ if(ch==='"'){q=!q;} else if(ch===','&&!q){out.push(cur);cur='';} else cur+=ch; }
  out.push(cur); return out;
}
const priceRows = csv.slice(1).map(l=>{
  const v=parseCsvLine(l); const o={};
  headers.forEach((h,i)=>o[h.trim()]=v[i]); return {json:o};
});
console.log('Lista de precios cargada:', priceRows.length, 'productos\n');

// ════════════════════════════════════════════════════════════════════════════
// ESCENARIO A — Merchandising con varios productos
// ════════════════════════════════════════════════════════════════════════════
console.log('═══ ESCENARIO A: "Cotización 100 tazas y 50 lápices sublimados" ═══');
const correoA = {json:{
  id:'18f1a2b3c4d5e6', threadId:'18f1a2b3c4d5e6',
  from:'Lorna Imbert <lorna@bauchemie.cl>',
  subject:'Cotización 100 tazas y 50 lápices sublimados',
  text:'Hola, necesito cotizar 100 tazas sublimadas y 50 lápices para un evento. Saludos, Lorna.',
  snippet:''
}};

// n2 parse
const n2out = runCode(codeOf('Parsear correo y generar ID OT'), [correoA]);
const d2 = n2out[0].json;
console.log('  ID_OT:', d2.ID_OT);
console.log('  Message_ID capturado:', d2.Message_ID);
console.log('  Cliente:', d2.Cliente, '| Email:', d2.Email_Cliente);
console.log('  Area:', d2.Area, '| LineaNegocio:', d2.LineaNegocio);

// n3c preparar cotizacion
const n3cout = runCode(codeOf('Preparar cotizacion Merchandising'), [n2out[0]]);
console.log('  N_Cotiz:', n3cout[0].json.N_Cotiz, '| Fecha:', n3cout[0].json.Fecha_Formal);

// n3f calcular precios (merge: email item + price rows)
const mergeInput = [n3cout[0], ...priceRows];
const refMap = { 'Preparar cotizacion Merchandising': n3cout };
const n3fout = runCode(codeOf('Calcular precios y generar cotizacion'), mergeInput, refMap);
const d3f = n3fout[0].json;
console.log('  cotizacion_automatica:', d3f.cotizacion_automatica);
console.log('  Productos detectados:');
for(let i=1;i<=5;i++){ if(d3f['Producto_'+i]) console.log('    -', d3f['Producto_'+i], '| cant:', d3f['Cantidad_'+i], '| unit:', d3f['ValorUnit_'+i], '| subtotal:', d3f['Subtotal_'+i]); }
console.log('  Subtotal_General (neto):', d3f.Subtotal_General);
console.log('  IVA_19:', d3f.IVA_19);
console.log('  Total:', d3f.Total);

// Verificacion aritmetica esperada: 100*2500 + 50*350 = 267500 ; IVA=50825 ; total=318325
const espNeto = 100*2500 + 50*350, espIva = Math.round(espNeto*0.19), espTotal = espNeto+espIva;
console.log('  >> Esperado: neto='+espNeto+' iva='+espIva+' total='+espTotal);
console.log('  >> CORRECTO:', d3f.Subtotal_General===espNeto && d3f.IVA_19===espIva && d3f.Total===espTotal ? 'SI ✓' : 'NO ✗');

// n4-prep notificacion cliente (referencia a n3f)
const refMap2 = { 'Calcular precios y generar cotizacion': n3fout };
// n4 normalmente devuelve los campos del append; simulamos pasando d3f como salida de n4
const n4prepOut = runCode(codeOf('Preparar notificacion cliente'), [{json:d3f}], refMap2);
console.log('  Asunto al cliente:', n4prepOut[0].json.asuntoCliente);

// Guardar HTML de la cotizacion para vista previa
fs.writeFileSync('demo_cotizacion_ejemplo.html', d3f.htmlCotizacion);
console.log('  HTML de cotización generado:', d3f.htmlCotizacion.length, 'chars -> demo_cotizacion_ejemplo.html');

// ════════════════════════════════════════════════════════════════════════════
// ESCENARIO B — Merch SIN match en lista (producto no listado)
// ════════════════════════════════════════════════════════════════════════════
console.log('\n═══ ESCENARIO B: "Cotización llaveros metálicos" (no está en lista) ═══');
const correoB = {json:{ id:'msgB', from:'Juan <juan@x.cl>', subject:'Cotización 200 llaveros metálicos grabados', text:'200 llaveros', snippet:'' }};
const n2B = runCode(codeOf('Parsear correo y generar ID OT'), [correoB]);
console.log('  Area:', n2B[0].json.Area, '| LineaNegocio:', n2B[0].json.LineaNegocio, '(llavero no es keyword -> Papeleria)');

// ════════════════════════════════════════════════════════════════════════════
// ESCENARIO C — Papelería
// ════════════════════════════════════════════════════════════════════════════
console.log('\n═══ ESCENARIO C: "Pedido 500 cuadernos anillados" (Papelería) ═══');
const correoC = {json:{ id:'msgC', from:'Maria <maria@colegio.cl>', subject:'Pedido 500 cuadernos anillados', text:'500 cuadernos', snippet:'' }};
const n2C = runCode(codeOf('Parsear correo y generar ID OT'), [correoC]);
console.log('  Area:', n2C[0].json.Area, '| Disenador:', n2C[0].json.Disenador_Asignado);
const n4prepC = runCode(codeOf('Preparar notificacion cliente'), [{json:n2C[0].json}], {});
console.log('  Mensaje cliente incluye "encargado":', n4prepC[0].json.mensajeCliente.includes('encargado') ? 'SI ✓ (cotización manual)' : 'NO');

console.log('\n═══ TODAS LAS PRUEBAS EJECUTADAS ═══');
