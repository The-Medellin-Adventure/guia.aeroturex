# Audioguía Medellín → Guatapé

App de audioguía virtual de una sola página (`index.html`), sin backend. Funciona en cualquier hosting estático (Vercel, Netlify, GitHub Pages).

## Estructura

```
guatape-audioguide/
  index.html          <- la app completa (HTML + CSS + JS embebido)
  images/
    stops/             <- pon aquí las fotos de cada parada
  avatar/               <- pon aquí la foto o el video del guía
  README.md
```

## Cómo agregar imágenes y video (recomendado para producción)

En vez de subir archivos directamente desde el panel de administración (que los guarda como texto base64 y puede volverse pesado), sube tus archivos a estas carpetas del repositorio y luego, en el panel admin, usa el campo **"O pega una ruta/URL"** con una ruta relativa, por ejemplo:

- Imagen de una parada: `images/stops/penol-1.jpg`
- Foto del guía: `avatar/guia.jpg`
- Video del guía: `avatar/guia.mp4`

Esto hace que el sitio cargue más rápido y no dependa del almacenamiento del navegador.

También puedes seguir usando el botón de "Subir imagen" para pruebas rápidas — se guarda como base64 directamente en el navegador, lo cual es más simple pero no ideal para archivos grandes ni para video.

## Sobre el video del avatar (HeyGen u otro similar)

Si generas un video con HeyGen (u otra herramienta similar), súbelo a `avatar/` en el repositorio y ponlo como ruta en el campo de video del panel admin. El video se reproduce **en silencio y en bucle** mientras se narra la parada — no reemplaza la voz (que sigue siendo la síntesis de voz del navegador en el idioma elegido) ni sincroniza los labios por parada. Para lip-sync real por parada tendrías que generar un video por parada/idioma y cambiar la lógica de reproducción — posible, pero es un paso adicional que no está incluido aquí.

## Importante: almacenamiento de los datos

Esta app detecta si corre dentro de Claude.ai (usa su almacenamiento) o de forma independiente (usa `localStorage` del navegador). **`localStorage` es por navegador/dispositivo**: los cambios que hagas en el panel admin desde tu computador no se verán automáticamente en el celular de otro visitante. Si necesitas que las ediciones del admin se vean para todos los visitantes del sitio, considera conectar una base de datos simple (Supabase, Vercel KV o Firebase) — feliz de ayudarte con eso si llegas a necesitarlo.

## Desplegar en Vercel

1. Sube esta carpeta a un repositorio de GitHub.
2. En Vercel: "Add New Project" → importa el repo.
3. Framework Preset: **Other** (sitio estático).
4. Build Command: (dejar vacío)
5. Output Directory: `.` (raíz)
6. Deploy.

Listo — tu audioguía queda en una URL de Vercel.

## Acceso al panel admin

Contraseña de demostración: `guatape2026` (defínela en el código si quieres cambiarla — búscala en `index.html`).
