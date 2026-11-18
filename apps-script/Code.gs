/**
 * Backend del panel /admin de Total Automotriz.
 *
 * Cómo usarlo:
 * 1. Abrí la planilla de Google Sheets del catálogo.
 * 2. Menú Extensiones > Apps Script.
 * 3. Borrá lo que haya y pegá todo este archivo.
 * 4. Completá CLAVES con la clave de administrador y la de empleado.
 * 5. Implementar > Nueva implementación > Aplicación web.
 * 6. Ejecutar como: Yo. Quién tiene acceso: Cualquier persona.
 * 7. Copiá la URL que termina en /exec y pegala en VITE_APPS_SCRIPT_URL del .env.
 */

// Claves del panel, una por rol. Cambiá cada una por la clave real.
// Si una queda con el texto PONER_..., ese rol queda deshabilitado.
const CLAVES = {
  admin: 'PONER_LA_CLAVE_ADMIN',
  empleado: 'PONER_LA_CLAVE_EMPLEADO',
}

// Nombre de la pestaña de la planilla. Si la dejás vacía, el script busca
// automáticamente la primera pestaña que tenga las columnas id y modelo.
const HOJA = ''

// Opcional: si creaste el script suelto (no desde la planilla), pegá acá el ID
// de la planilla. Si lo creaste desde Extensiones > Apps Script, dejalo vacío.
const SHEET_ID = ''

function doGet() {
  try {
    const hoja = obtenerHoja(obtenerLibro())
    return json({
      ok: true,
      mensaje: 'Panel Total Automotriz activo',
      hoja: hoja.getName(),
    })
  } catch (error) {
    return json({ ok: true, mensaje: 'Panel Total Automotriz activo' })
  }
}

function doPost(e) {
  try {
    const data = JSON.parse((e && e.postData && e.postData.contents) || '{}')
    const rol = buscarRol(data.clave)

    if (!rol) {
      return json({ ok: false, error: 'Clave incorrecta o sesión vencida.' })
    }

    const accion = String(data.accion || '')

    if (accion === 'login') {
      return json({ ok: true, rol: rol })
    }

    if (accion === 'actualizarFotos') {
      return json(actualizarFotos(data))
    }

    if (accion === 'actualizarVehiculo') {
      return json(actualizarVehiculo(data))
    }

    if (accion === 'eliminarVehiculo') {
      return json(eliminarVehiculo(data))
    }

    const id = guardarVehiculo(data)
    return json({ ok: true, id: id, rol: rol })
  } catch (error) {
    return json({
      ok: false,
      error: error && error.message ? error.message : 'Error inesperado.',
    })
  }
}

function buscarRol(clave) {
  const valor = limpio(clave)
  if (!valor) return ''

  const roles = Object.keys(CLAVES)

  for (let i = 0; i < roles.length; i += 1) {
    const rol = roles[i]
    const esperada = limpio(CLAVES[rol])

    // Las claves sin configurar no habilitan el acceso.
    if (!esperada || esperada.indexOf('PONER_') === 0) continue
    if (valor === esperada) return rol
  }

  return ''
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  )
}

function guardarVehiculo(data) {
  const lock = LockService.getScriptLock()
  lock.waitLock(20000)

  try {
    const libro = obtenerLibro()
    const hoja = obtenerHoja(libro)
    const headers = leerHeaders(hoja)

    const fila = new Array(headers.length).fill('')
    const valores = {
      categoria: limpio(data.categoria),
      modelo: limpio(data.modelo),
      anio: limpio(data.anio),
      combustible: limpio(data.combustible),
      detalle: limpio(data.detalle),
      moneda: limpio(data.moneda),
      precio: Number(data.precio) || 0,
      disponible: 'SI',
      descripcion: limpio(data.descripcion),
      foto_url: Array.isArray(data.fotos)
        ? data.fotos.map(limpio).filter(Boolean).join('|')
        : limpio(data.fotos),
    }

    headers.forEach(function (header, index) {
      const clave = normalizarHeader(header)

      if (clave === 'id') {
        fila[index] = siguienteId(hoja, headers)
      } else if (Object.prototype.hasOwnProperty.call(valores, clave)) {
        fila[index] = valores[clave]
      }
    })

    // Insertar en la fila 2 para que el vehículo nuevo quede arriba de todo.
    hoja.insertRowBefore(2)
    const destino = hoja.getRange(2, 1, 1, headers.length)
    destino.setValues([fila])
    copiarFormatoFila(hoja, destino, headers.length)

    const idIndex = headers.findIndex(function (header) {
      return normalizarHeader(header) === 'id'
    })

    return idIndex >= 0 ? fila[idIndex] : ''
  } finally {
    lock.releaseLock()
  }
}

function obtenerLibro() {
  const libro = SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet()

  if (!libro) {
    throw new Error('No se encontró la planilla. Revisá SHEET_ID.')
  }

  return libro
}

/**
 * Reemplaza la lista de fotos de un vehículo existente.
 * Recibe el id y el array completo de URLs que deben quedar.
 */
function actualizarFotos(data) {
  const lock = LockService.getScriptLock()
  lock.waitLock(20000)

  try {
    const libro = obtenerLibro()
    const hoja = obtenerHoja(libro)
    const headers = leerHeaders(hoja)
    const idIndex = indiceColumna(headers, 'id')
    const fotoIndex = indiceColumna(headers, 'foto_url')

    if (idIndex < 0) {
      throw new Error('La planilla no tiene la columna id.')
    }

    if (fotoIndex < 0) {
      throw new Error('La planilla no tiene la columna foto_url.')
    }

    const id = limpio(data.id)
    if (!id) throw new Error('Falta el id del vehículo.')

    const fila = buscarFilaPorId(hoja, idIndex, id)

    if (fila < 1) {
      throw new Error('No encontramos el vehículo en la planilla.')
    }

    const fotos = Array.isArray(data.fotos)
      ? data.fotos.map(limpio).filter(Boolean)
      : []

    hoja.getRange(fila, fotoIndex + 1).setValue(fotos.join('|'))

    return { ok: true, id: id, fotos: fotos.length }
  } finally {
    lock.releaseLock()
  }
}

/**
 * Actualiza los datos de un vehículo existente sin tocar el id.
 */
function actualizarVehiculo(data) {
  const lock = LockService.getScriptLock()
  lock.waitLock(20000)

  try {
    const libro = obtenerLibro()
    const hoja = obtenerHoja(libro)
    const headers = leerHeaders(hoja)
    const idIndex = indiceColumna(headers, 'id')

    if (idIndex < 0) {
      throw new Error('La planilla no tiene la columna id.')
    }

    const id = limpio(data.id)
    if (!id) throw new Error('Falta el id del vehículo.')

    const fila = buscarFilaPorId(hoja, idIndex, id)

    if (fila < 1) {
      throw new Error('No encontramos el vehículo en la planilla.')
    }

    const valores = {
      categoria: limpio(data.categoria),
      modelo: limpio(data.modelo),
      anio: limpio(data.anio),
      combustible: limpio(data.combustible),
      detalle: limpio(data.detalle),
      moneda: limpio(data.moneda),
      precio: Number(data.precio) || 0,
      descripcion: limpio(data.descripcion),
      disponible: limpio(data.disponible).toUpperCase() === 'NO' ? 'NO' : 'SI',
    }

    if (Array.isArray(data.fotos)) {
      valores.foto_url = data.fotos.map(limpio).filter(Boolean).join('|')
    }

    const rango = hoja.getRange(fila, 1, 1, headers.length)
    const filaActual = rango.getValues()[0]

    headers.forEach(function (header, index) {
      const clave = normalizarHeader(header)

      if (Object.prototype.hasOwnProperty.call(valores, clave)) {
        filaActual[index] = valores[clave]
      }
    })

    rango.setValues([filaActual])

    return { ok: true, id: id }
  } finally {
    lock.releaseLock()
  }
}

/**
 * Elimina la fila del vehículo. No borra las fotos de Cloudinary.
 */
function eliminarVehiculo(data) {
  const lock = LockService.getScriptLock()
  lock.waitLock(20000)

  try {
    const libro = obtenerLibro()
    const hoja = obtenerHoja(libro)
    const headers = leerHeaders(hoja)
    const idIndex = indiceColumna(headers, 'id')

    if (idIndex < 0) {
      throw new Error('La planilla no tiene la columna id.')
    }

    const id = limpio(data.id)
    if (!id) throw new Error('Falta el id del vehículo.')

    const fila = buscarFilaPorId(hoja, idIndex, id)

    if (fila < 1) {
      throw new Error('No encontramos el vehículo en la planilla.')
    }

    hoja.deleteRow(fila)

    return { ok: true, id: id }
  } finally {
    lock.releaseLock()
  }
}

function indiceColumna(headers, nombre) {
  for (let i = 0; i < headers.length; i += 1) {
    if (normalizarHeader(headers[i]) === nombre) return i
  }

  return -1
}

function buscarFilaPorId(hoja, idIndex, id) {
  const ultimaFila = hoja.getLastRow()
  if (ultimaFila < 2) return -1

  const valores = hoja
    .getRange(2, idIndex + 1, ultimaFila - 1, 1)
    .getValues()

  for (let i = 0; i < valores.length; i += 1) {
    if (limpio(valores[i][0]) === id) return i + 2
  }

  return -1
}

function leerHeaders(hoja) {
  return hoja
    .getRange(1, 1, 1, Math.max(1, hoja.getLastColumn()))
    .getValues()[0]
}

function obtenerHoja(libro) {
  if (HOJA) {
    const hojaElegida = libro.getSheetByName(HOJA)
    if (hojaElegida) return hojaElegida
  }

  const hojas = libro.getSheets()

  for (let i = 0; i < hojas.length; i += 1) {
    const columnas = leerHeaders(hojas[i]).map(normalizarHeader)

    if (columnas.indexOf('id') >= 0 && columnas.indexOf('modelo') >= 0) {
      return hojas[i]
    }
  }

  return hojas[0]
}

function copiarFormatoFila(hoja, destino, columnas) {
  if (hoja.getLastRow() < 3) return

  const modelo = hoja.getRange(3, 1, 1, columnas)

  try {
    modelo.copyTo(destino, SpreadsheetApp.CopyPasteType.PASTE_FORMAT, false)
    modelo.copyTo(
      destino,
      SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION,
      false,
    )
  } catch (error) {
    // Si la hoja no tiene validaciones, el vehículo se guarda igual.
  }
}

function siguienteId(hoja, headers) {
  const idIndex = headers.findIndex(function (header) {
    return normalizarHeader(header) === 'id'
  })

  if (idIndex < 0) return ''

  const ultimaFila = hoja.getLastRow()
  if (ultimaFila < 2) return 1

  const ids = hoja
    .getRange(2, idIndex + 1, ultimaFila - 1, 1)
    .getValues()
    .map(function (fila) {
      return Number(fila[0])
    })
    .filter(function (valor) {
      return Number.isFinite(valor)
    })

  return (ids.length ? Math.max.apply(null, ids) : 0) + 1
}

function normalizarHeader(valor) {
  return String(valor == null ? '' : valor)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function limpio(valor) {
  return String(valor == null ? '' : valor).trim()
}
