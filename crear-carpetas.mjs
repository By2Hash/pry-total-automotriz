import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const baseDir = path.join(rootDir, 'fotos-originales')

const vehiculos = [
  { id: 1, nombre: 'Rover 2001' },
  { id: 2, nombre: 'Daihatsu Charade 1980' },
  { id: 3, nombre: 'Renault Twingo 2000' },
  { id: 4, nombre: 'Peugeot 206 2001' },
  { id: 5, nombre: 'Ford Fiesta 2001' },
  { id: 6, nombre: 'Gol GL 1994' },
  { id: 7, nombre: 'Chevrolet Blazer 1998' },
  { id: 8, nombre: 'Corsa Wagon 2008' },
  { id: 9, nombre: 'Partner HDI 2014' },
  { id: 10, nombre: 'Renault Fluence 1.6 2012' },
  { id: 11, nombre: 'Ford Fiesta 2015' },
  { id: 12, nombre: 'Chevrolet Montana 2011' },
  { id: 13, nombre: 'Kangoo 2014' },
  { id: 14, nombre: 'Suran 2012' },
  { id: 15, nombre: 'Bora TDI 2010' },
  { id: 16, nombre: 'Bora 2.0 Azul 2008' },
  { id: 17, nombre: 'Kangoo 2011' },
  { id: 18, nombre: 'Ford Fiesta AT 2014' },
  { id: 19, nombre: 'Chevrolet Cruze LTZ 2015' },
  { id: 20, nombre: 'Peugeot 208 2018' },
  { id: 21, nombre: 'Fiat 500L 2014' },
  { id: 22, nombre: 'Vento TDI 2014' },
  { id: 23, nombre: 'Vento Luxury 2.5 2014' },
  { id: 24, nombre: 'Mercedes C220 CDI 2008' },
  { id: 25, nombre: 'Hilux SRV 2013' },
  { id: 26, nombre: 'Chevrolet S10 LT 2021' },
  { id: 27, nombre: 'Mercedes Benz GLA 250 2014' },
  { id: 28, nombre: 'BMW X6 3.0 2011' },
  { id: 29, nombre: 'Amarok V6 Extreme 2021' },
  { id: 30, nombre: 'Audi A3 2016' },
  { id: 31, nombre: 'Toyota SW4 Diamond 2025' },
  { id: 32, nombre: 'Amarok Ultimate 2016' },
  { id: 33, nombre: 'Palio P 2016' },
  { id: 34, nombre: 'Kangoo P 2025' },
  { id: 35, nombre: 'Peugeot 207 P 2013' },
  { id: 36, nombre: 'Fiat Idea' },
  { id: 37, nombre: 'Ranger C Simple 2011' },
  { id: 38, nombre: 'Amarok 2021' },
  { id: 39, nombre: 'Vento 2.0 TDI' },
  { id: 40, nombre: 'Fiat Toro Vulcano P 4x4 2017' },
  { id: 41, nombre: 'Peugeot 208 P 2023' },
  { id: 42, nombre: 'Gilera 125 SMX 2022' },
  { id: 43, nombre: 'Yamaha FZ 2014' },
  { id: 44, nombre: 'Kawasaki Ninja 250 2010' },
  { id: 45, nombre: 'Yamaha Raptor 700R' },
  { id: 46, nombre: 'Yamaha FZ1 2009' },
  { id: 47, nombre: 'Yamaha R1 2011' },
  { id: 48, nombre: 'BMW GS 650 2005' },
  { id: 49, nombre: 'Plancha para autos Grua Iveco 1994' },
  { id: 50, nombre: 'Autoelevador' },
  { id: 51, nombre: 'Camion 1114 Mecanica 1518 1970' },
  { id: 52, nombre: 'Renault Sandero 2018' },
]

mkdirSync(baseDir, { recursive: true })

let creadas = 0
let existentes = 0
const errores = []

for (const vehiculo of vehiculos) {
  const carpeta = path.join(baseDir, `${vehiculo.id} ${vehiculo.nombre}`)

  if (existsSync(carpeta)) {
    existentes += 1
    continue
  }

  try {
    mkdirSync(carpeta, { recursive: true })
    creadas += 1
  } catch (error) {
    errores.push(`${vehiculo.id} ${vehiculo.nombre}: ${error.message}`)
  }
}

console.log(`Carpeta base: ${baseDir}`)
console.log(`Carpetas creadas: ${creadas}`)
console.log(`Carpetas que ya existían: ${existentes}`)
console.log(`Total en la lista: ${vehiculos.length}`)

if (errores.length) {
  console.error('\nNo se pudieron crear estas carpetas:')
  errores.forEach((error) => console.error(`- ${error}`))
  process.exitCode = 1
}
