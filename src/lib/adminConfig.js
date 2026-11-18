export const MAX_PHOTOS = 10

export const ROLE_LABELS = {
  admin: 'Administrador',
  empleado: 'Empleado',
}

export function roleLabel(role) {
  return ROLE_LABELS[role] || 'Usuario'
}

export const CATEGORIES = [
  'Autos y utilitarios',
  'Vehículos P',
  'Motos',
  'Maquinaria y equipos',
]

export const FUELS = ['Nafta', 'Nafta/GNC', 'Diésel', 'Automático']

export const YEARS = Array.from(
  { length: 2027 - 1950 + 1 },
  (_, index) => 2027 - index,
)
