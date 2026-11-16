import Papa from 'papaparse'
import { catalogConfig } from '../config'
import { normalizeRows } from './normalize'

export class SheetError extends Error {
  constructor(message, code = 'sheet-error', status = null) {
    super(message)
    this.name = 'SheetError'
    this.code = code
    this.status = status
  }
}

const CORE_COLUMNS = ['categoria', 'modelo', 'moneda', 'precio', 'disponible']

export function parseVehiculosCsv(text) {
  if (!text || /^\s*<!doctype html/i.test(text)) {
    throw new SheetError(
      'El Sheet no devolvió un CSV válido. Revisá que esté publicado como CSV.',
      'invalid-csv',
    )
  }

  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
    transformHeader: (header) => header.replace(/^\ufeff/, '').trim(),
  })

  if (result.errors?.some((error) => error.type === 'Delimiter')) {
    throw new SheetError(
      'No pudimos interpretar el CSV del catálogo.',
      'invalid-csv',
    )
  }

  const fields = result.meta?.fields ?? []
  const missing = CORE_COLUMNS.filter((column) => !fields.includes(column))

  if (missing.length) {
    throw new SheetError(
      `Faltan columnas en el Sheet: ${missing.join(', ')}.`,
      'missing-columns',
    )
  }

  return normalizeRows(result.data)
}

export async function fetchVehiculos({ signal } = {}) {
  const url = catalogConfig.csvUrl

  if (!url) {
    throw new SheetError(
      'Falta configurar VITE_SHEET_CSV_URL en el archivo .env.',
      'missing-url',
    )
  }

  let response

  try {
    response = await fetch(url, {
      signal,
      cache: 'no-store',
      redirect: 'follow',
    })
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    throw new SheetError(
      'No pudimos conectarnos con el catálogo.',
      'network-error',
    )
  }

  if (!response.ok) {
    throw new SheetError(
      `El catálogo respondió con el estado ${response.status}.`,
      'http-error',
      response.status,
    )
  }

  const text = await response.text()
  return parseVehiculosCsv(text)
}
