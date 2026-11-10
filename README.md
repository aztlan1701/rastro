# RASTRO

Dashboard open source de inteligencia civil para monitoreo de personas desaparecidas en México.

Patrones inspirados en [OSIRIS](https://github.com/simplifaisoul/osiris): API routes con caché, capas MapLibre progresivas, agregador RSS/GDELT.

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
- `GET /api/monitor` — monitoreo de RSS + GDELT; el webhook solo se dispara con token
- `GET /api/news` — RSS configurable
- `GET /api/gdelt` — noticias GDELT filtradas México

## Tabs del dashboard

| Tecla | Tab |
|---|---|
| 1 | Mapa |
| 2 | Noticias |
| 3 | Datos |
| 4 | Buscar |

Atajos adicionales: `L` capas · `N` noticias geo · `Esc` limpiar · `?` ayuda

## Variables de entorno

| Variable | Descripción |
|---|---|
| `RASTRO_RNPDNO_CSV_URL` | URL del CSV RNPDNO |
| `RASTRO_VAD_BORRADOS_CSV_URL` | CSV nombres borrados |
| `RASTRO_RECONSTRUCCION_AGGREGADOS_URL` | JSON agregados 2017–2024 |
| `RASTRO_RSS_FEEDS` | Feeds RSS separados por coma |
| `RASTRO_MONITOR_KEYWORDS` | Keywords para `/api/monitor` |
| `RASTRO_MONITOR_ESTADOS` | Filtrar monitor por estado |
| `RASTRO_ALERT_WEBHOOK_URL` | Webhook POST al detectar coincidencias |
| `RASTRO_MONITOR_TOKEN` | Secreto que la petición debe presentar para disparar el webhook |
| `RASTRO_USER_AGENT` | Agente con el que RASTRO se identifica ante las fuentes |
| `NEXT_PUBLIC_MAP_STYLE` | Estilo del mapa base (MapLibre) |
| `RASTRO_PORT` | Puerto publicado por docker compose |

## Salvaguardas

- Sin alta de casos ni almacenamiento de consultas; no hay base de datos.
- Búsqueda e inconsistencias: máximo 100 registros por consulta y 30 consultas por minuto por IP.
- Informes por estado: solo agregados, 10 por minuto por IP, con todo valor escapado.
- Búsqueda, inconsistencias, informes y monitoreo responden con `X-Robots-Tag: noindex`.
- El webhook de `/api/monitor` solo se dispara si `RASTRO_MONITOR_TOKEN` está definido y la petición lo presenta (`Authorization: Bearer <token>`). Sin token la ruta sigue siendo pública, pero no envía nada.

Los límites por IP usan `X-Forwarded-For`: despliega RASTRO detrás de un proxy que fije esa cabecera.

## Metodología

Ver `/metodologia` en la app o el componente de aviso de uso en el dashboard.

## Docker

```bash
cp .env.template .env
docker compose up -d --build
```

Abre `http://localhost:${RASTRO_PORT:-3000}`.
