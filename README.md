# RASTRO

Dashboard open source de inteligencia civil para monitoreo de personas desaparecidas en México.

Patrones inspirados en [OSIRIS](https://github.com/simplifaisoul/osiris): API routes con caché, capas MapLibre progresivas, agregador RSS/GDELT/Telegram.

## Stack

- Next.js 16 (App Router, Turbopack)
- TypeScript 5
- MapLibre GL JS
- Tailwind CSS 4
- Framer Motion

## Desarrollo

```bash
cp .env.template .env
npm install
npm run dev
```

## API routes

- `GET /api/rnpdno` — agregado estatal + municipios
- `GET /api/amber` — alertas AMBER
- `GET /api/news` — RSS configurable
- `GET /api/gdelt` — noticias GDELT filtradas México
- `GET /api/telegram-feed` — posts geoparseados de canales públicos

## Atajos de teclado

| Tecla | Acción |
|---|---|
| 1–4 | Tabs mapa / alertas / noticias / datos |
| L | Panel de capas |
| A | Toggle AMBER (en mapa) |
| N | Toggle noticias geo (en mapa) |
| Esc | Cerrar panel / deseleccionar |

## Docker

```bash
cp .env.template .env
docker compose up -d --build
```

Abre `http://localhost:${RASTRO_PORT:-3000}`.
