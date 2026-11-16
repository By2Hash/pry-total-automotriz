const env = import.meta.env

const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ6U3utJJBdH9PZB-cpaKQoZiMUbI_4BSfwpuDCopJ-2H-I0ZSuonKXGZa19V6PDj04YBPnfWW6_GBA/pub?output=csv'

export const siteConfig = {
  nombre: 'Total Automotriz',
  ciudad: 'Córdoba',
  provincia: 'Córdoba',
  pais: 'Argentina',
  descripcion:
    'Autos, utilitarios, motos y maquinaria. Dos sucursales en Córdoba para que puedas conocernos.',
  whatsapp: env.VITE_WHATSAPP_NUMBER || '351-599-9008',
  instagram:
    env.VITE_INSTAGRAM_URL || 'https://www.instagram.com/totalautomotriz.ok/',
  sucursales: [
    { nombre: 'Sucursal 1', direccion: 'Coronel Olmedo 1810' },
    { nombre: 'Sucursal 2', direccion: 'Cura Brochero 372' },
  ],
  horarios: null,
}

export const catalogConfig = {
  csvUrl: env.VITE_SHEET_CSV_URL || DEFAULT_SHEET_URL,
  cacheVersion: 1,
  categorias: [
    'Autos y utilitarios',
    'Vehículos P',
    'Motos',
    'Maquinaria y equipos',
  ],
}

export const generalWhatsAppMessage =
  'Hola, quiero consultar por los vehículos disponibles.'
