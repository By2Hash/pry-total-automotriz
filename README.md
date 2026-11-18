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
| `VITE_SHEET_CSV_URL` | URL del Google Sheet publicado como CSV (`?output=csv&gid=…`). Conviene incluir el `gid` de la pestaña para que Google no sirva una copia vieja. |
| `VITE_WHATSAPP_NUMBER` | Número de WhatsApp; acepta guiones o formato internacional. |
| `VITE_INSTAGRAM_URL` | URL del perfil de Instagram. |
| `VITE_APPS_SCRIPT_URL` | URL del Web App de Apps Script que valida la clave y recibe los vehículos del panel `/admin`. Si queda vacía se usa la URL por defecto de `src/config.js`. |
| `VITE_SHEET_EDIT_URL` | URL de la planilla en modo edición. El panel muestra un acceso directo a Google Sheets; si queda vacía se usa la URL por defecto de `src/config.js`. |
| `VITE_CLOUDINARY_CLOUD` | Cloud name de Cloudinary (por ejemplo, `psnj9pq6`). |
| `VITE_CLOUDINARY_PRESET` | Upload preset **unsigned** de Cloudinary. Distingue mayúsculas y minúsculas. |

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
- `foto_url` puede traer varias URLs separadas por `|`; se muestran en ese orden y la primera es la portada.
- Las fotos del vehículo se toman de `foto_url` (las cargadas desde el panel); si está vacío, se usa `/fotos/manifest.json` y por último el placeholder.

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

## Panel de carga `/admin`

El panel se abre desde el enlace discreto **“Acceso”** en la esquina superior izquierda del encabezado (`/admin`); con sesión iniciada ese enlace pasa a decir **“Cargar vehículo”**. Es mobile-first y permite cargar un vehículo con fotos desde el celular y editar las fotos de los vehículos ya publicados.

### Acceso

1. Entrá al panel desde **“Acceso”** en la esquina superior izquierda del catálogo (o directamente a `/admin`) e ingresá tu clave.
2. El panel valida la clave contra Apps Script (`POST` con `{ "accion": "login", "clave": "…" }`), que devuelve el rol: **administrador** o **empleado**. Ambos pueden cargar vehículos, editar sus datos y fotos, y eliminarlos.
3. La clave queda **solo en `sessionStorage`** de esa pestaña: no se guarda en el código, en `.env`, en `localStorage` ni en IndexedDB. Al cerrar sesión se borra.
4. Si la sesión se pierde, la cola pendiente se pausa y pide login; al volver a ingresar se reanuda sola.

La clave real debe configurarse **en Apps Script**, nunca en este repositorio.

### Crear el backend en Apps Script (una sola vez)

El panel necesita un Web App de Google Apps Script que valide la clave y agregue la fila a la planilla. El código está en [`apps-script/Code.gs`](apps-script/Code.gs).

1. Abrí la planilla del catálogo en Google Sheets.
2. Menú **Extensiones → Apps Script**.
3. Borrá el contenido que haya y pegá todo `apps-script/Code.gs`.
4. Completá `CLAVES` con la clave de cada rol. Si una queda con el texto `PONER_…`, ese rol no puede entrar. Si tu pestaña no se llama `vehiculos`, ajustá `HOJA`.
5. **Implementar → Nueva implementación → Aplicación web**.
6. En **Ejecutar como** elegí **Yo**; en **Quién tiene acceso** elegí **Cualquier persona**.
7. Autorizá los permisos y copiá la URL que termina en `/exec`.
8. Pegala en `.env`:

```bash
VITE_APPS_SCRIPT_URL="https://script.google.com/macros/s/AKfy.../exec"
```

9. Reiniciá el servidor (`npm run dev`). Si ya estaba abierto, hace falta reiniciarlo para que Vite lea la nueva variable.

Cada vez que cambies el código o la clave en Apps Script, creá una **nueva versión** de la implementación desde **Implementar → Administrar implementaciones**, así la URL sigue siendo la misma.

### Contrato de Apps Script

El Web App debe estar publicado para “Cualquiera” y aceptar `POST` con `Content-Type: text/plain;charset=utf-8` para evitar el preflight de CORS.

Login:

```json
{ "accion": "login", "clave": "…" }
```

Respuesta:

```json
{ "ok": true, "rol": "admin" }
```

`rol` puede ser `admin` o `empleado`. Las claves se configuran en `CLAVES`, dentro de Apps Script; nunca en el repositorio.

Alta de vehículo:

```json
{
  "clave": "…",
  "categoria": "Autos y utilitarios",
  "modelo": "Amarok V6 Extreme",
  "anio": "2018",
  "combustible": "Nafta",
  "detalle": "",
  "moneda": "ARS",
  "precio": 1200000,
  "descripcion": "Único dueño, service oficial.",
  "fotos": [
    "https://res.cloudinary.com/psnj9pq6/image/upload/…",
    "https://res.cloudinary.com/psnj9pq6/image/upload/…"
  ]
}
```

- `anio` viaja como string; los opcionales vacíos van como `""`.
- `precio` viaja como número y `fotos` en el orden elegido: la primera es la portada.
- Si Apps Script guarda las URLs en la columna `foto_url`, conviene unirlas con `|` para que el catálogo muestre la galería completa de los vehículos nuevos.
- La respuesta se considera exitosa si trae `ok` o `success` en `true` (también se acepta el texto `ok`). Si devuelve `ok: false` o un error, el vehículo queda en la cola para reintentar.

Edición de un vehículo existente:

```json
{
  "accion": "actualizarVehiculo",
  "clave": "…",
  "id": "52",
  "categoria": "Motos",
  "modelo": "Dos editado",
  "anio": "2012",
  "combustible": "Diésel",
  "detalle": "",
  "moneda": "ARS",
  "precio": 2500,
  "descripcion": "…",
  "disponible": "SI",
  "fotos": ["https://…", "https://…"]
}
```

Apps Script actualiza solo las columnas permitidas y nunca cambia el `id`. Si `fotos` viene en el pedido, reemplaza `foto_url` con las URLs unidas por `|`.

Eliminación:

```json
{ "accion": "eliminarVehiculo", "clave": "…", "id": "52" }
```

Borra la fila del vehículo. No borra las fotos de Cloudinary.

También sigue disponible la acción acotada `actualizarFotos`, que solo modifica `foto_url`.

### Editar y eliminar vehículos

- En la pestaña **Vehículos** del panel se elige un vehículo, se editan sus datos (categoría, modelo, año, combustible, detalle, moneda, precio, descripción y disponibilidad) y sus fotos.
- Los cambios se suben a Cloudinary y después se guardan en la planilla. No usan la cola offline: requieren conexión.
- El botón **Eliminar** borra la fila de la planilla después de pedir confirmación. No se puede deshacer.
- Quitar una foto la saca del catálogo, pero **no** borra el archivo de Cloudinary. Tampoco se borra al eliminar el vehículo. Si se quieren borrar los archivos, hay que hacerlo desde la Media Library de Cloudinary.

### Fotos y Cloudinary

- Se aceptan hasta 10 fotos por vehículo y **al menos una** es obligatoria.
- Al publicar, cada imagen se convierte a **WebP** de hasta 1600 px y después se sube al cloud de Cloudinary con el preset unsigned.
- Las fotos comprimidas se guardan en IndexedDB antes de empezar, y cada URL que devuelve Cloudinary se guarda al terminar; si se corta la subida, al reintentar no se vuelven a subir las que ya estaban listas.

### Cola offline

- Al tocar “Publicar”, el vehículo se guarda **siempre** en IndexedDB (campos, fotos WebP y estado) antes de subirse.
- Sin conexión se muestra “Guardado en el dispositivo” y la subida se reanuda automáticamente al volver internet, al volver a la pestaña, al abrir la app y cada 45 segundos.
- La lista “Cargas pendientes” muestra el estado, el progreso, el error y permite “Reintentar” o “Eliminar”.
- No se usa Background Sync: si la app está cerrada por completo, la cola se procesa la próxima vez que se abra. El envío final necesita una sesión activa.
- Se pide almacenamiento persistente al navegador para reducir el riesgo de que el sistema borre las fotos guardadas.

### Publicación

Además de compilar, el hosting debe redirigir `/admin` (y cualquier ruta de la SPA) a `index.html`. Ejemplos:

- **Netlify:** `/*  /index.html  200` en `_redirects`.
- **Vercel:** rewrite de `/(.*)` a `/index.html`.
- **Nginx:** `try_files $uri $uri/ /index.html;`.

### Caché y actualizaciones

- El service worker guarda el CSV y las fotos con nombres de caché versionados (`…-sheet-v2`, `…-fotos-v2`). Al cambiar esos nombres en `vite.config.js`, las visitas descartan el contenido viejo sin que el usuario tenga que limpiar nada.
- La lista de vehículos también se cachea en `localStorage` con `catalogConfig.cacheVersion` (`src/config.js`). Subir ese número invalida la copia anterior.
- El CSV se cachea 1 hora y las fotos 7 días. Las fotos subidas desde el panel tienen URL única, así que no necesitan invalidación.
- Si se reemplazan archivos fijos de `public/fotos/` conservando el mismo nombre, conviene subir la versión de los cachés (o purgar la caché del hosting) para que no queden imágenes viejas.

## Estructura

```text
src/
  components/
    admin/      Panel /admin: login, formulario, fotos y cola pendiente
    catalog/    Buscador, tabs, filtros, tarjetas y grilla
    feedback/   Skeleton, sin resultados, error y aviso sin conexión
    layout/     Navbar, footer, redes y selector de tema
  data/         Lectura del Sheet, normalización y caché
  hooks/        Datos, filtros, tema, estado de conexión y cola del panel
  lib/          Formatos, WhatsApp, fotos, Apps Script, Cloudinary y cola
  styles/       Tokens y estilos por sección
public/         Logo, iconos PWA, fotos optimizadas y manifest generado en el build
fotos-originales/  Fotos originales (no se versionan)
```

## Personalización

- Datos del negocio, sucursales y categorías: `src/config.js`.
- Colores, tipografía y radios: `src/styles/tokens.css`.
- Orden, filtros y buscador: `src/hooks/useCatalogFilters.js`.
- Manifest e iconos PWA: `vite.config.js` y `public/`.
