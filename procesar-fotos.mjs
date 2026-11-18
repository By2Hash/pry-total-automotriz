import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const IN = 'fotos-originales';
const OUT = 'public/fotos';
const exts = ['.jpg', '.jpeg', '.png', '.webp'];
const PORTADA = /(portada|frente|delantera)/i;

// opcional: node procesar-fotos.mjs 52 12  -> solo convierte esos ids
const soloIds = process.argv.slice(2).map(Number).filter(Boolean);

function listarFotos(dir) {
  const archivos = fs.readdirSync(dir)
    .filter(f => exts.includes(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const portada = archivos.find(f => PORTADA.test(f));
  return portada ? [portada, ...archivos.filter(f => f !== portada)] : archivos;
}

const carpetas = fs.readdirSync(IN)
  .filter(d => fs.statSync(path.join(IN, d)).isDirectory() && /^\d+/.test(d))
  .map(d => ({ nombre: d, id: Number(d.match(/^\d+/)[0]) }))
  .sort((a, b) => a.id - b.id);

const resultado = {};

for (const { nombre, id } of carpetas) {
  const dir = path.join(IN, nombre);
  const fotos = listarFotos(dir);

  if (!soloIds.length || soloIds.includes(id)) {
    const outDir = path.join(OUT, String(id));
    fs.rmSync(outDir, { recursive: true, force: true }); // borra lo viejo
    if (fotos.length) fs.mkdirSync(outDir, { recursive: true });
    let n = 1;
    for (const f of fotos) {
      await sharp(path.join(dir, f))
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 78 })
        .toFile(path.join(outDir, `${n}.webp`));
      n++;
    }
    console.log(`Auto ${id}: ${fotos.length} fotos (portada: ${fotos[0] || '-'})`);
  }

  resultado[id] = fotos.map((_, i) => `/fotos/${id}/${i + 1}.webp`).join('|');
}

const max = Math.max(...carpetas.map(c => c.id));
const lineas = [];
for (let i = 1; i <= max; i++) lineas.push(resultado[i] || '');
fs.writeFileSync('foto_url_para_pegar.txt', lineas.join('\n'));
console.log('Listo: foto_url_para_pegar.txt');
