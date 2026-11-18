const env = import.meta.env

const DEFAULT_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ6U3utJJBdH9PZB-cpaKQoZiMUbI_4BSfwpuDCopJ-2H-I0ZSuonKXGZa19V6PDj04YBPnfWW6_GBA/pub?output=csv&gid=2011651525'

const DEFAULT_SHEET_EDIT_URL =
  'https://docs.google.com/spreadsheets/d/1XhNbMYHfBP3tHqHpsIF_HldRLhF0aciAIjGD3bIZb7k/edit?gid=2011651525#gid=2011651525'

const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbw-HO6uphasUDMy5djxukPcTHyseJxPa0cUf4boOy0bm391dwQ5ZRcYKfJ2_xHDoXX0Iw/exec'

// El cloud name y el preset unsigned son públicos: viajan en el bundle igual.
const DEFAULT_CLOUDINARY_CLOUD = 'psnj9pq6'
const DEFAULT_CLOUDINARY_PRESET = 'Total_Automotriz'

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
    { nombre: 'Sucursal 3', direccion: 'Armenia 1818' },
  ],
  horarios: null,
}

export const catalogConfig = {
  csvUrl: env.VITE_SHEET_CSV_URL || DEFAULT_SHEET_URL,
  sheetEditUrl: env.VITE_SHEET_EDIT_URL || DEFAULT_SHEET_EDIT_URL,
  cacheVersion: 2,
  categorias: [
    'Autos y utilitarios',
    'Vehículos P',
    'Motos',
    'Maquinaria y equipos',
  ],
}

export const adminConfig = {
  appsScriptUrl: String(
    env.VITE_APPS_SCRIPT_URL || DEFAULT_APPS_SCRIPT_URL,
  ).trim(),
  cloudinaryCloud: String(
    env.VITE_CLOUDINARY_CLOUD || DEFAULT_CLOUDINARY_CLOUD,
  ).trim(),
  cloudinaryPreset: String(
    env.VITE_CLOUDINARY_PRESET || DEFAULT_CLOUDINARY_PRESET,
  ).trim(),
}

export const generalWhatsAppMessage =
  'Hola, quiero consultar por los vehículos disponibles.'
