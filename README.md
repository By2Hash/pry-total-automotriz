# Total Automotriz · Catálogo

Catálogo web mobile-first de vehículos usados de Total Automotriz (Córdoba, Argentina). La información se lee desde un Google Sheet publicado como CSV y se muestra como PWA instalable, con filtros, tema claro/oscuro y consultas por WhatsApp.

## Stack

- React 19 + Vite 8
- Papaparse para leer el CSV
- `vite-plugin-pwa` con Workbox (NetworkFirst para el catálogo)
- `@fontsource-variable/inter` y `react-icons`
- CSS propio con tokens de tema, sin framework de UI

## Puesta en marcha

```bash
npm install
cp .env.example .env
npm run dev
```

Completá `.env` con la URL del Sheet, el WhatsApp y el Instagram. Si falta la URL, la app usa el catálogo público de Total Automotriz por defecto.

```bash
npm run lint
npm run build
npm run preview
```

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `VITE_SHEET_CSV_URL` | URL del Google Sheet publicado como CSV (`?output=csv`). |
| `VITE_WHATSAPP_NUMBER` | Número de WhatsApp; acepta guiones o formato internacional. |
| `VITE_INSTAGRAM_URL` | URL del perfil de Instagram. |

## Datos del catálogo

El Sheet debe tener estas columnas:

```text
id, categoria, modelo, anio, combustible, detalle, moneda, precio, disponible, descripcion, foto_url
```

- Solo se muestran las filas con `disponible = SI`.
- `categoria` debe ser una de: `Autos y utilitarios`, `Vehículos P`, `Motos`, `Maquinaria y equipos`.
- `moneda` define el formato: `ARS` → `$ 1.200.000`, `USD` → `USD 10.500`.
- `detalle` se muestra como etiqueta sobre la foto (por ejemplo, `No funciona`).
- Los campos vacíos (`anio`, `combustible`, `detalle`, `descripcion`, `foto_url`) no se renderizan.
- Las fotos del vehículo se cargan desde `/fotos/manifest.json`; si no hay, se usa `foto_url` y por último el placeholder.

## Fotos de los vehículos

Las imágenes originales se guardan en `fotos-originales/<id> <modelo> <año>/` y no se suben al repositorio (están en `.gitignore`). Para publicarlas, optimizalas a WebP y generá el manifiesto:

```bash
npm run fotos
```

El script `procesar-fotos.mjs`:

- Lee cada carpeta de `fotos-originales/` y ordena los archivos de forma natural.
- Genera `/fotos/<id>/<n>.webp` (hasta 1600 px, calidad 80) y `/fotos/<id>/<n>-thumb.webp` (480 px, calidad 70) en `public/fotos/`.
- Reescribe `public/fotos/manifest.json` con la lista de fotos de cada vehículo.
- **Reconstruye `public/fotos/` completo en cada corrida**, así que no guardes ahí archivos que no provengan de `fotos-originales/`.

Requiere `ffmpeg` disponible en el `PATH`. Si está en otra ruta, definí `FFMPEG_PATH` con la ruta al ejecutable. El script no se ejecuta automáticamente en `build`: los assets generados se versionan para poder publicar sin los originales.

## PWA y modo sin conexión

- El CSV se guarda en `localStorage` después de cada carga exitosa.
- El service worker usa NetworkFirst para el CSV, con 5 segundos de espera y copia por 7 días.
- Sin conexión (o si el Sheet falla) se muestra la última copia guardada y un aviso.
- El tema claro/oscuro se guarda en `localStorage` y respeta la preferencia del sistema en la primera visita.

## Estructura

```text
src/
  components/
    catalog/    Buscador, tabs, filtros, tarjetas y grilla
    feedback/   Skeleton, sin resultados, error y aviso sin conexión
    layout/     Navbar, footer, redes y selector de tema
  data/         Lectura del Sheet, normalización y caché
  hooks/        Datos, filtros, tema y estado de conexión
  lib/          Formatos, WhatsApp y fotos
  styles/       Tokens y estilos por sección
public/         Logo, iconos PWA, fotos optimizadas y manifest generado en el build
fotos-originales/  Fotos originales (no se versionan)
```

## Personalización

- Datos del negocio, sucursales y categorías: `src/config.js`.
- Colores, tipografía y radios: `src/styles/tokens.css`.
- Orden, filtros y buscador: `src/hooks/useCatalogFilters.js`.
- Manifest e iconos PWA: `vite.config.js` y `public/`.
