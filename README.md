# RASTRO

Dashboard open source de inteligencia civil para monitoreo de personas desaparecidas en México.

Patrones inspirados en [OSIRIS](https://github.com/simplifaisoul/osiris): API routes con caché, capas MapLibre progresivas, agregador RSS/GDELT/Telegram.

Integración con [Volver a Desaparecer](https://volveradesaparecer.datacivica.org) (Data Cívica) para trazabilidad del RNPDNO.

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

- `GET /api/rnpdno` — agregado estatal + municipios (RNPDNO sep 2023)
- `GET /api/volver-a-desaparecer` — resumen VAD + reconstrucción 2017–2024
- `GET /api/buscar?q=&source=&estadoId=&sexo=` — búsqueda por nombre
- `GET /api/inconsistencias?estadoId=&limit=` — registros ELIMINADO / borrados
- `GET /api/informe/[estadoId]` — informe HTML descargable por estado
- `GET /api/monitor` — monitoreo OSINT + webhook opcional
- `GET /api/amber` — alertas AMBER (modo demo)
- `GET /api/news` — RSS configurable
- `GET /api/gdelt` — noticias GDELT filtradas México
- `GET /api/telegram-feed` — posts geoparseados de canales públicos

## Tabs del dashboard

| Tecla | Tab |
|---|---|
| 1 | Mapa |
| 2 | Alertas |
| 3 | Noticias |
| 4 | Datos |
| 5 | Buscar |

Atajos adicionales: `L` capas · `A` AMBER · `N` noticias geo · `Esc` limpiar · `?` ayuda

## Variables de entorno

| Variable | Descripción |
|---|---|
| `RASTRO_RNPDNO_CSV_URL` | URL del CSV RNPDNO |
| `RASTRO_VAD_BORRADOS_CSV_URL` | CSV nombres borrados |
| `RASTRO_RECONSTRUCCION_AGGREGADOS_URL` | JSON agregados 2017–2024 |
| `RASTRO_RSS_FEEDS` | Feeds RSS separados por coma |
| `RASTRO_TELEGRAM_CHANNELS` | Canales Telegram públicos |
| `RASTRO_MONITOR_KEYWORDS` | Keywords para `/api/monitor` |
| `RASTRO_MONITOR_ESTADOS` | Filtrar monitor por estado |
| `RASTRO_ALERT_WEBHOOK_URL` | Webhook POST al detectar coincidencias |

## Metodología

Ver `/metodologia` en la app o el componente de aviso de uso en el dashboard.

## Docker

```bash
cp .env.template .env
docker compose up -d --build
```

Abre `http://localhost:${RASTRO_PORT:-3000}`.
