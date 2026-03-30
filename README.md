{
  "name": "OT Imprenta Verde - Trazabilidad de Pedidos",
  "nodes": [
    {
      "parameters": {
        "content": "## 🟢 FLUJO OT - LA IMPRENTA VERDE\n**Fase 1: Trazabilidad de Pedidos**\n\nEste workflow monitorea la bandeja de correo compartida, genera una OT, clasifica por área de producción, registra en Google Sheets y notifica a diseñador, cliente y secretarias.\n\n### ⚙️ CONFIGURACIÓN REQUERIDA:\n1. Conectar credencial Gmail (bandeja compartida)\n2. Conectar credencial Google Sheets\n3. Reemplazar `SPREADSHEET_ID_PLACEHOLDER` en el nodo de Sheets\n4. Reemplazar `SHEETS_URL_PLACEHOLDER` en el nodo de notificación al diseñador",
        "height": 220,
        "width": 500,
        "color": 4
      },
      "id": "sticky-intro",
      "name": "Sticky Note - Intro",
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [-200, -300]
    },
    {
      "parameters": {
        "content": "## 📥 SECCIÓN 1: RECEPCIÓN\nEl trigger monitorea la bandeja compartida cada minuto buscando correos con palabras clave en el asunto: cotización, pedido, orden, solicitud.",
        "height": 120,
        "width": 380,
        "color": 5
      },
      "id": "sticky-seccion1",
      "name": "Sticky Note - Seccion 1",
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [220, -300]
    },
    {
      "parameters": {
        "content": "## 🔀 SECCIÓN 2: CLASIFICACIÓN\nEl Switch analiza el asunto y cuerpo del correo y asigna el área correspondiente (Ropa, Librería, Plastificados, Merchandising o Por Asignar).",
        "height": 120,
        "width": 380,
        "color": 5
      },
      "id": "sticky-seccion2",
      "name": "Sticky Note - Seccion 2",
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [820, -300]
    },
    {
      "parameters": {
        "content": "## 📊 SECCIÓN 3: REGISTRO Y NOTIFICACIONES\nRegistra la OT en Google Sheets y envía emails al diseñador asignado, al cliente (confirmación) y a las secretarias (alerta).",
        "height": 120,
        "width": 380,
        "color": 5
      },
      "id": "sticky-seccion3",
      "name": "Sticky Note - Seccion 3",
      "type": "n8n-nodes-base.stickyNote",
      "typeVersion": 1,
      "position": [1420, -300]
    },
    {
      "parameters": {
        "pollTimes": {
          "item": [
            {
              "mode": "everyMinute"
            }
          ]
        },
        "filters": {
          "q": "subject:(cotización OR pedido OR orden OR solicitud) is:unread"
        },
        "options": {
          "dataPropertyAttachmentsPrefixName": "attachment_"
        }
      },
      "id": "node-gmail-trigger",
      "name": "Nuevo pedido por correo",
      "type": "n8n-nodes-base.gmailTrigger",
      "typeVersion": 1,
      "position": [240, 0],
      "credentials": {
        "gmailOAuth2": {
          "id": "GMAIL_CREDENTIAL_ID_PLACEHOLDER",
          "name": "Gmail - Bandeja Compartida La Imprenta Verde"
        }
      }
    },
    {
      "parameters": {
        "jsCode": "// ============================================================\n// NODO: Extraer datos del pedido\n// Genera OT única y estructura los datos del correo recibido\n// ============================================================\n\nconst item = $input.first();\nconst emailData = item.json;\n\n// --- Generar ID de OT único ---\nconst now = new Date();\nconst yyyy = now.getFullYear();\nconst mm = String(now.getMonth() + 1).padStart(2, '0');\nconst dd = String(now.getDate()).padStart(2, '0');\nconst dateStr = `${yyyy}${mm}${dd}`;\n\n// Contador secuencial basado en timestamp para evitar colisiones\nconst seq = String(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()).slice(-3).padStart(3, '0');\nconst idOT = `OT-${dateStr}-${seq}`;\n\n// --- Extraer datos del correo ---\nconst remitente = emailData.from || emailData.From || '';\nconst emailCliente = remitente.match(/[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}/) \n  ? remitente.match(/[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}/)[0] \n  : remitente;\n\nconst nombreCliente = remitente.replace(/<.*>/, '').replace(/\"/g, '').trim() || emailCliente.split('@')[0];\nconst asunto = emailData.subject || emailData.Subject || 'Sin asunto';\nconst cuerpo = emailData.text || emailData.snippet || emailData.body || '';\nconst fechaIngreso = new Date().toISOString();\n\n// --- Calcular fecha entrega estimada (+2 días hábiles) ---\nfunction addBusinessDays(date, days) {\n  let result = new Date(date);\n  let added = 0;\n  while (added < days) {\n    result.setDate(result.getDate() + 1);\n    const dow = result.getDay();\n    if (dow !== 0 && dow !== 6) added++;\n  }\n  return result;\n}\n\nconst fechaEntrega = addBusinessDays(new Date(), 2);\nconst fechaEntregaStr = fechaEntrega.toLocaleDateString('es-CL', {\n  day: '2-digit', month: '2-digit', year: 'numeric'\n});\n\nreturn [{\n  json: {\n    ID_OT: idOT,\n    Fecha_Ingreso: fechaIngreso,\n    Cliente: nombreCliente,\n    Email_Cliente: emailCliente,\n    Asunto_Pedido: asunto,\n    Cuerpo_Correo: cuerpo,\n    Estado: 'Recibido',\n    Fecha_Entrega_Estimada: fechaEntregaStr,\n    Va_A_Externo: 'No',\n    Proveedor_Externo: '',\n    Fecha_Retorno_Externo: '',\n    Modalidad_Despacho: '',\n    Notas: '',\n    Fecha_Cierre: '',\n    // Metadatos originales del correo\n    _emailId: emailData.id || emailData.messageId || '',\n    _threadId: emailData.threadId || ''\n  }\n}];\n"
      },
      "id": "node-parse",
      "name": "Extraer datos del pedido",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [540, 0]
    },
    {
      "parameters": {
        "mode": "rules",
        "rules": {
          "values": [
            {
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "leftValue": "",
                  "typeValidation": "strict"
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.Asunto_Pedido + ' ' + $json.Cuerpo_Correo }}",
                    "rightValue": "polera|ropa|camiseta|polo",
                    "operator": {
                      "type": "string",
                      "operation": "regex"
                    }
                  }
                ],
                "combinator": "any"
              },
              "renameOutput": true,
              "outputKey": "Ropa"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "leftValue": "",
                  "typeValidation": "strict"
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.Asunto_Pedido + ' ' + $json.Cuerpo_Correo }}",
                    "rightValue": "cuaderno|agenda|anillado|espiral|librer",
                    "operator": {
                      "type": "string",
                      "operation": "regex"
                    }
                  }
                ],
                "combinator": "any"
              },
              "renameOutput": true,
              "outputKey": "Libreria"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "leftValue": "",
                  "typeValidation": "strict"
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.Asunto_Pedido + ' ' + $json.Cuerpo_Correo }}",
                    "rightValue": "plastificado|laminado|carpeta",
                    "operator": {
                      "type": "string",
                      "operation": "regex"
                    }
                  }
                ],
                "combinator": "any"
              },
              "renameOutput": true,
              "outputKey": "Plastificados"
            },
            {
              "conditions": {
                "options": {
                  "caseSensitive": false,
                  "leftValue": "",
                  "typeValidation": "strict"
                },
                "conditions": [
                  {
                    "leftValue": "={{ $json.Asunto_Pedido + ' ' + $json.Cuerpo_Correo }}",
                    "rightValue": "taza|l[aá]piz|lapicera|merchandising|gift",
                    "operator": {
                      "type": "string",
                      "operation": "regex"
                    }
                  }
                ],
                "combinator": "any"
              },
              "renameOutput": true,
              "outputKey": "Merchandising"
            }
          ]
        },
        "fallbackOutput": "extra"
      },
      "id": "node-switch",
      "name": "Clasificar área de producción",
      "type": "n8n-nodes-base.switch",
      "typeVersion": 3,
      "position": [840, 0]
    },
    {
      "parameters": {
        "jsCode": "// Área: Ropa\nconst item = $input.first();\nreturn [{\n  json: {\n    ...item.json,\n    Área: 'Ropa',\n    Diseñador_Asignado: 'diseñador_ropa@laimprentaverde.cl'\n  }\n}];\n"
      },
      "id": "node-set-ropa",
      "name": "Set área Ropa",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1100, -200]
    },
    {
      "parameters": {
        "jsCode": "// Área: Librería\nconst item = $input.first();\nreturn [{\n  json: {\n    ...item.json,\n    Área: 'Librería',\n    Diseñador_Asignado: 'diseñador_libreria@laimprentaverde.cl'\n  }\n}];\n"
      },
      "id": "node-set-libreria",
      "name": "Set área Librería",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1100, -40]
    },
    {
      "parameters": {
        "jsCode": "// Área: Plastificados\nconst item = $input.first();\nreturn [{\n  json: {\n    ...item.json,\n    Área: 'Plastificados',\n    Diseñador_Asignado: 'diseñador_plastificados@laimprentaverde.cl'\n  }\n}];\n"
      },
      "id": "node-set-plastificados",
      "name": "Set área Plastificados",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1100, 120]
    },
    {
      "parameters": {
        "jsCode": "// Área: Merchandising\nconst item = $input.first();\nreturn [{\n  json: {\n    ...item.json,\n    Área: 'Merchandising',\n    Diseñador_Asignado: 'diseñador_merchandising@laimprentaverde.cl'\n  }\n}];\n"
      },
      "id": "node-set-merchandising",
      "name": "Set área Merchandising",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1100, 280]
    },
    {
      "parameters": {
        "jsCode": "// Área: Por Asignar (fallback)\nconst item = $input.first();\nreturn [{\n  json: {\n    ...item.json,\n    Área: 'Por Asignar',\n    Diseñador_Asignado: 'diseñador1@laimprentaverde.cl'\n  }\n}];\n"
      },
      "id": "node-set-default",
      "name": "Set área Por Asignar",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1100, 440]
    },
    {
      "parameters": {
        "mode": "combine",
        "combineBy": "combineAll",
        "options": {}
      },
      "id": "node-merge",
      "name": "Merge áreas",
      "type": "n8n-nodes-base.merge",
      "typeVersion": 3,
      "position": [1360, 120]
    },
    {
      "parameters": {
        "operation": "appendOrUpdate",
        "documentId": {
          "__rl": true,
          "value": "SPREADSHEET_ID_PLACEHOLDER",
          "mode": "id"
        },
        "sheetName": {
          "__rl": true,
          "value": "Órdenes de Taller",
          "mode": "name"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "ID_OT": "={{ $json.ID_OT }}",
            "Fecha_Ingreso": "={{ $json.Fecha_Ingreso }}",
            "Cliente": "={{ $json.Cliente }}",
            "Email_Cliente": "={{ $json.Email_Cliente }}",
            "Asunto_Pedido": "={{ $json.Asunto_Pedido }}",
            "Área": "={{ $json.Área }}",
            "Diseñador_Asignado": "={{ $json.Diseñador_Asignado }}",
            "Estado": "={{ $json.Estado }}",
            "Fecha_Entrega_Estimada": "={{ $json.Fecha_Entrega_Estimada }}",
            "Va_A_Externo": "={{ $json.Va_A_Externo }}",
            "Proveedor_Externo": "={{ $json.Proveedor_Externo }}",
            "Fecha_Retorno_Externo": "={{ $json.Fecha_Retorno_Externo }}",
            "Modalidad_Despacho": "={{ $json.Modalidad_Despacho }}",
            "Notas": "={{ $json.Notas }}",
            "Fecha_Cierre": "={{ $json.Fecha_Cierre }}"
          },
          "schema": [
            {"id": "ID_OT", "displayName": "ID_OT", "required": false, "defaultMatch": false, "canBeUsedToMatch": true, "display": true, "type": "string"},
            {"id": "Fecha_Ingreso", "displayName": "Fecha_Ingreso", "required": false, "defaultMatch": false, "canBeUsedToMatch": false, "display": true, "type": "string"},
            {"id": "Cliente", "displayName": "Cliente", "required": false, "defaultMatch": false, "canBeUsedToMatch": false, "display": true, "type": "string"},
            {"id": "Email_Cliente", "displayName": "Email_Cliente", "required": false, "defaultMatch": false, "canBeUsedToMatch": false, "display": true, "type": "string"},
            {"id": "Asunto_Pedido", "displayName": "Asunto_Pedido", "required": false, "defaultMatch": false, "canBeUsedToMatch": false, "display": true, "type": "string"},
            {"id": "Área", "displayName": "Área", "required": false, "defaultMatch": false, "canBeUsedToMatch": false, "display": true, "type": "string"},
            {"id": "Diseñador_Asignado", "displayName": "Diseñador_Asignado", "required": false, "defaultMatch": false, "canBeUsedToMatch": false, "display": true, "type": "string"},
            {"id": "Estado", "displayName": "Estado", "required": false, "defaultMatch": false, "canBeUsedToMatch": false, "display": true, "type": "string"},
            {"id": "Fecha_Entrega_Estimada", "displayName": "Fecha_Entrega_Estimada", "required": false, "defaultMatch": false, "canBeUsedToMatch": false, "display": true, "type": "string"},
            {"id": "Va_A_Externo", "displayName": "Va_A_Externo", "required": false, "defaultMatch": false, "canBeUsedToMatch": false, "display": true, "type": "string"},
            {"id": "Proveedor_Externo", "displayName": "Proveedor_Externo", "required": false, "defaultMatch": false, "canBeUsedToMatch": false, "display": true, "type": "string"},
            {"id": "Fecha_Retorno_Externo", "displayName": "Fecha_Retorno_Externo", "required": false, "defaultMatch": false, "canBeUsedToMatch": false, "display": true, "type": "string"},
            {"id": "Modalidad_Despacho", "displayName": "Modalidad_Despacho", "required": false, "defaultMatch": false, "canBeUsedToMatch": false, "display": true, "type": "string"},
            {"id": "Notas", "displayName": "Notas", "required": false, "defaultMatch": false, "canBeUsedToMatch": false, "display": true, "type": "string"},
            {"id": "Fecha_Cierre", "displayName": "Fecha_Cierre", "required": false, "defaultMatch": false, "canBeUsedToMatch": false, "display": true, "type": "string"}
          ]
        },
        "options": {}
      },
      "id": "node-sheets",
      "name": "Registrar en hoja de OT",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4,
      "position": [1620, 120],
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "GOOGLE_SHEETS_CREDENTIAL_ID_PLACEHOLDER",
          "name": "Google Sheets - La Imprenta Verde"
        }
      }
    },
    {
      "parameters": {
        "sendTo": "={{ $json.Diseñador_Asignado }}",
        "subject": "=[OT {{ $json.ID_OT }}] Nuevo pedido asignado: {{ $json.Asunto_Pedido }}",
        "emailType": "html",
        "message": "=<!DOCTYPE html>\n<html lang=\"es\">\n<head><meta charset=\"UTF-8\"></head>\n<body style=\"font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;\">\n  <div style=\"background-color: #2d6a4f; padding: 20px; text-align: center;\">\n    <h1 style=\"color: white; margin: 0;\">🖨️ La Imprenta Verde</h1>\n    <p style=\"color: #b7e4c7; margin: 5px 0 0;\">Sistema de Órdenes de Taller</p>\n  </div>\n  <div style=\"padding: 30px; background: #f9f9f9; border: 1px solid #ddd;\">\n    <h2 style=\"color: #2d6a4f;\">Nuevo pedido asignado a tu área</h2>\n    <table style=\"width: 100%; border-collapse: collapse;\">\n      <tr style=\"border-bottom: 1px solid #eee;\">\n        <td style=\"padding: 10px; font-weight: bold; width: 40%;\">ID Orden de Taller:</td>\n        <td style=\"padding: 10px; font-size: 18px; color: #2d6a4f; font-weight: bold;\">{{ $json.ID_OT }}</td>\n      </tr>\n      <tr style=\"border-bottom: 1px solid #eee; background: #fff;\">\n        <td style=\"padding: 10px; font-weight: bold;\">Cliente:</td>\n        <td style=\"padding: 10px;\">{{ $json.Cliente }}</td>\n      </tr>\n      <tr style=\"border-bottom: 1px solid #eee;\">\n        <td style=\"padding: 10px; font-weight: bold;\">Descripción del pedido:</td>\n        <td style=\"padding: 10px;\">{{ $json.Asunto_Pedido }}</td>\n      </tr>\n      <tr style=\"border-bottom: 1px solid #eee; background: #fff;\">\n        <td style=\"padding: 10px; font-weight: bold;\">Área asignada:</td>\n        <td style=\"padding: 10px;\">{{ $json.Área }}</td>\n      </tr>\n      <tr style=\"border-bottom: 1px solid #eee;\">\n        <td style=\"padding: 10px; font-weight: bold;\">Fecha de entrega estimada:</td>\n        <td style=\"padding: 10px; color: #e63946; font-weight: bold;\">{{ $json.Fecha_Entrega_Estimada }}</td>\n      </tr>\n    </table>\n    <div style=\"background: #d8f3dc; border-left: 4px solid #2d6a4f; padding: 15px; margin: 20px 0; border-radius: 4px;\">\n      <p style=\"margin: 0;\"><strong>📋 Acción requerida:</strong> Actualiza el estado en el Sheets cuando comiences y cuando termines el pedido.</p>\n    </div>\n    <div style=\"text-align: center; margin: 25px 0;\">\n      <a href=\"SHEETS_URL_PLACEHOLDER\" style=\"background-color: #2d6a4f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;\">📊 Abrir Hoja de Órdenes</a>\n    </div>\n  </div>\n  <div style=\"padding: 15px; text-align: center; color: #888; font-size: 12px; background: #eee;\">\n    <p>La Imprenta Verde | pedidos@laimprentaverde.cl | Este es un mensaje automático.</p>\n  </div>\n</body>\n</html>",
        "options": {}
      },
      "id": "node-email-disenador",
      "name": "Notificar diseñador",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2,
      "position": [1880, -40],
      "credentials": {
        "gmailOAuth2": {
          "id": "GMAIL_CREDENTIAL_ID_PLACEHOLDER",
          "name": "Gmail - Bandeja Compartida La Imprenta Verde"
        }
      }
    },
    {
      "parameters": {
        "sendTo": "={{ $json.Email_Cliente }}",
        "subject": "=Pedido recibido - Folio {{ $json.ID_OT }} | La Imprenta Verde",
        "emailType": "html",
        "message": "=<!DOCTYPE html>\n<html lang=\"es\">\n<head><meta charset=\"UTF-8\"></head>\n<body style=\"font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;\">\n  <div style=\"background-color: #2d6a4f; padding: 20px; text-align: center;\">\n    <h1 style=\"color: white; margin: 0;\">🖨️ La Imprenta Verde</h1>\n    <p style=\"color: #b7e4c7; margin: 5px 0 0;\">Confirmación de pedido recibido</p>\n  </div>\n  <div style=\"padding: 30px; background: #f9f9f9; border: 1px solid #ddd;\">\n    <p>Estimado/a <strong>{{ $json.Cliente }}</strong>,</p>\n    <p>Hemos recibido exitosamente tu solicitud y la estamos procesando con nuestro compromiso habitual de calidad y puntualidad.</p>\n    <div style=\"background: #d8f3dc; border: 2px solid #2d6a4f; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;\">\n      <p style=\"margin: 0; font-size: 14px; color: #555;\">Número de folio para seguimiento</p>\n      <p style=\"margin: 5px 0; font-size: 28px; font-weight: bold; color: #2d6a4f;\">{{ $json.ID_OT }}</p>\n      <p style=\"margin: 0; font-size: 12px; color: #777;\">Guarda este número para consultar el estado de tu pedido</p>\n    </div>\n    <table style=\"width: 100%; border-collapse: collapse;\">\n      <tr style=\"border-bottom: 1px solid #eee;\">\n        <td style=\"padding: 10px; font-weight: bold; width: 45%;\">Descripción recibida:</td>\n        <td style=\"padding: 10px;\">{{ $json.Asunto_Pedido }}</td>\n      </tr>\n      <tr style=\"border-bottom: 1px solid #eee; background: #fff;\">\n        <td style=\"padding: 10px; font-weight: bold;\">Fecha estimada de entrega:</td>\n        <td style=\"padding: 10px; color: #2d6a4f; font-weight: bold;\">{{ $json.Fecha_Entrega_Estimada }}</td>\n      </tr>\n    </table>\n    <p style=\"margin-top: 20px;\">Nuestro equipo de diseño revisará tu pedido y se pondrá en contacto si necesita información adicional.</p>\n    <div style=\"background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;\">\n      <p style=\"margin: 0;\"><strong>¿Necesitas información sobre tu pedido?</strong></p>\n      <p style=\"margin: 5px 0 0;\">Contacta a nuestras secretarias mencionando tu número de folio:</p>\n      <ul style=\"margin: 5px 0;\">\n        <li>📧 secretarias@laimprentaverde.cl</li>\n        <li>📞 Teléfono: +56 2 XXXX XXXX</li>\n      </ul>\n    </div>\n    <p>¡Gracias por confiar en <strong>La Imprenta Verde</strong>! Trabajamos con dedicación para entregar resultados de excelencia.</p>\n    <p>Saludos cordiales,<br><strong>Equipo La Imprenta Verde</strong></p>\n  </div>\n  <div style=\"padding: 15px; text-align: center; color: #888; font-size: 12px; background: #eee;\">\n    <p>La Imprenta Verde | pedidos@laimprentaverde.cl | www.laimprentaverde.cl</p>\n    <p>Este mensaje fue generado automáticamente al recibir tu solicitud.</p>\n  </div>\n</body>\n</html>",
        "options": {}
      },
      "id": "node-email-cliente",
      "name": "Confirmar al cliente",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2,
      "position": [1880, 120],
      "credentials": {
        "gmailOAuth2": {
          "id": "GMAIL_CREDENTIAL_ID_PLACEHOLDER",
          "name": "Gmail - Bandeja Compartida La Imprenta Verde"
        }
      }
    },
    {
      "parameters": {
        "sendTo": "secretarias@laimprentaverde.cl",
        "subject": "=[OT {{ $json.ID_OT }}] Nuevo pedido ingresado - {{ $json.Cliente }}",
        "emailType": "html",
        "message": "=<!DOCTYPE html>\n<html lang=\"es\">\n<head><meta charset=\"UTF-8\"></head>\n<body style=\"font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;\">\n  <div style=\"background-color: #2d6a4f; padding: 20px; text-align: center;\">\n    <h1 style=\"color: white; margin: 0;\">🖨️ La Imprenta Verde</h1>\n    <p style=\"color: #b7e4c7; margin: 5px 0 0;\">Alerta: Nuevo pedido ingresado</p>\n  </div>\n  <div style=\"padding: 30px; background: #f9f9f9; border: 1px solid #ddd;\">\n    <h2 style=\"color: #2d6a4f; margin-top: 0;\">📋 Resumen del nuevo pedido</h2>\n    <table style=\"width: 100%; border-collapse: collapse;\">\n      <tr style=\"background: #2d6a4f; color: white;\">\n        <th style=\"padding: 10px; text-align: left;\">Campo</th>\n        <th style=\"padding: 10px; text-align: left;\">Detalle</th>\n      </tr>\n      <tr style=\"border-bottom: 1px solid #eee;\">\n        <td style=\"padding: 10px; font-weight: bold;\">ID OT:</td>\n        <td style=\"padding: 10px; font-size: 16px; color: #2d6a4f; font-weight: bold;\">{{ $json.ID_OT }}</td>\n      </tr>\n      <tr style=\"border-bottom: 1px solid #eee; background: #fff;\">\n        <td style=\"padding: 10px; font-weight: bold;\">Cliente:</td>\n        <td style=\"padding: 10px;\">{{ $json.Cliente }}</td>\n      </tr>\n      <tr style=\"border-bottom: 1px solid #eee;\">\n        <td style=\"padding: 10px; font-weight: bold;\">Email:</td>\n        <td style=\"padding: 10px;\">{{ $json.Email_Cliente }}</td>\n      </tr>\n      <tr style=\"border-bottom: 1px solid #eee; background: #fff;\">\n        <td style=\"padding: 10px; font-weight: bold;\">Producto / Pedido:</td>\n        <td style=\"padding: 10px;\">{{ $json.Asunto_Pedido }}</td>\n      </tr>\n      <tr style=\"border-bottom: 1px solid #eee;\">\n        <td style=\"padding: 10px; font-weight: bold;\">Área asignada:</td>\n        <td style=\"padding: 10px;\">{{ $json.Área }}</td>\n      </tr>\n      <tr style=\"border-bottom: 1px solid #eee; background: #fff;\">\n        <td style=\"padding: 10px; font-weight: bold;\">Diseñador:</td>\n        <td style=\"padding: 10px;\">{{ $json.Diseñador_Asignado }}</td>\n      </tr>\n      <tr style=\"border-bottom: 1px solid #eee;\">\n        <td style=\"padding: 10px; font-weight: bold;\">Entrega estimada:</td>\n        <td style=\"padding: 10px; color: #e63946; font-weight: bold;\">{{ $json.Fecha_Entrega_Estimada }}</td>\n      </tr>\n      <tr style=\"background: #fff;\">\n        <td style=\"padding: 10px; font-weight: bold;\">Estado actual:</td>\n        <td style=\"padding: 10px;\"><span style=\"background: #b7e4c7; color: #2d6a4f; padding: 3px 8px; border-radius: 3px; font-weight: bold;\">{{ $json.Estado }}</span></td>\n      </tr>\n    </table>\n    <div style=\"text-align: center; margin: 25px 0;\">\n      <a href=\"SHEETS_URL_PLACEHOLDER\" style=\"background-color: #2d6a4f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;\">📊 Ver en Google Sheets</a>\n    </div>\n  </div>\n  <div style=\"padding: 15px; text-align: center; color: #888; font-size: 12px; background: #eee;\">\n    <p>La Imprenta Verde | Sistema automático de trazabilidad de pedidos</p>\n  </div>\n</body>\n</html>",
        "options": {}
      },
      "id": "node-email-secretarias",
      "name": "Notificar secretarias",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2,
      "position": [1880, 280],
      "credentials": {
        "gmailOAuth2": {
          "id": "GMAIL_CREDENTIAL_ID_PLACEHOLDER",
          "name": "Gmail - Bandeja Compartida La Imprenta Verde"
        }
      }
    }
  ],
  "connections": {
    "Nuevo pedido por correo": {
      "main": [
        [
          {
            "node": "Extraer datos del pedido",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Extraer datos del pedido": {
      "main": [
        [
          {
            "node": "Clasificar área de producción",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Clasificar área de producción": {
      "main": [
        [
          {
            "node": "Set área Ropa",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Set área Librería",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Set área Plastificados",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Set área Merchandising",
            "type": "main",
            "index": 0
          }
        ],
        [
          {
            "node": "Set área Por Asignar",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Set área Ropa": {
      "main": [
        [
          {
            "node": "Merge áreas",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Set área Librería": {
      "main": [
        [
          {
            "node": "Merge áreas",
            "type": "main",
            "index": 1
          }
        ]
      ]
    },
    "Set área Plastificados": {
      "main": [
        [
          {
            "node": "Merge áreas",
            "type": "main",
            "index": 2
          }
        ]
      ]
    },
    "Set área Merchandising": {
      "main": [
        [
          {
            "node": "Merge áreas",
            "type": "main",
            "index": 3
          }
        ]
      ]
    },
    "Set área Por Asignar": {
      "main": [
        [
          {
            "node": "Merge áreas",
            "type": "main",
            "index": 4
          }
        ]
      ]
    },
    "Merge áreas": {
      "main": [
        [
          {
            "node": "Registrar en hoja de OT",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Registrar en hoja de OT": {
      "main": [
        [
          {
            "node": "Notificar diseñador",
            "type": "main",
            "index": 0
          },
          {
            "node": "Confirmar al cliente",
            "type": "main",
            "index": 0
          },
          {
            "node": "Notificar secretarias",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "pinData": {},
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": [
    {
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "id": "tag-imprenta-verde",
      "name": "La Imprenta Verde"
    }
  ],
  "triggerCount": 1,
  "updatedAt": "2025-03-29T00:00:00.000Z",
  "versionId": "1"
}
