# RASTRO

Dashboard open source de inteligencia civil para monitoreo de personas desaparecidas en México.

Patrones inspirados en [OSIRIS](https://github.com/simplifaisoul/osiris): API routes con caché, capas MapLibre progresivas, agregador RSS/GDELT.

Integración con [Volver a Desaparecer](https://volveradesaparecer.datacivica.org) (Data Cívica) para trazabilidad del RNPDNO.

## Dos capas de datos RNPDNO

| Capa | Fuente | Actualidad | Usos en RASTRO |
|------|--------|------------|----------------|
| **Agregados estatales** | Tablero estadístico CNB (`versionpublicarnpdno.segob.gob.mx`) | Snapshot versionado (casi en vivo al regenerar) | Mapa nacional, ranking, stats, informes |
| **Agregados municipales** | Mismo tablero (`BarChartSexoMunicipio` por entidad) + respaldo CSV sep-2023 | Snapshot al regenerar ingest | Coropleta municipal al seleccionar un estado |
| **Nominales** | CSV RNPDNO + nombres borrados (Data Cívica) | Ago/dic 2023 | Buscar, inconsistencias |

El mapa **no** consulta el tablero en cada request. Lee el JSON congelado en `public/data/rnpdno-agregados.json`, generado por el script de ingesta con salvaguardas (intervalo 1.5 s, tope 60 peticiones, User-Agent identificable, sin paralelismo).

### Regenerar agregados estatales

```bash
pip install -r scripts/requirements.txt
python scripts/rnpdno_ingest.py --salida public/data/rnpdno-agregados.json
```

Incluye ~32 peticiones municipales (`BarChartSexoMunicipio`). En entidades grandes el tablero suele devolver solo los municipios con más registros; el resto puede cubrirse con el CSV vía la API. Usa `--sin-municipios` para omitir ese bloque.

### Regenerar geometría municipal

```bash
pip install -r scripts/requirements.txt
python scripts/build_municipios_geo.py
```

Genera `public/geo/municipios/{01..32}.geojson` (simplificado) y `public/data/municipios-catalogo.json` desde el endpoint INEGI wscatgeo.

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

- `GET /api/rnpdno` — agregados estatales (snapshot tablero CNB)
- `GET /api/rnpdno/municipios?estado=MX-JAL` — agregados municipales (CSV 2023 + CVEGEO)
- `GET /api/volver-a-desaparecer` — resumen VAD + reconstrucción 2017–2024
- `GET /api/buscar?q=&source=&estadoId=&sexo=` — búsqueda por nombre (CSV 2023)
- `GET /api/inconsistencias?estadoId=&limit=` — registros ELIMINADO / borrados (CSV 2023)
- `GET /api/informe/[estadoId]` — informe HTML descargable por estado
- `GET /api/monitor` — monitoreo OSINT + webhook opcional
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
| `RASTRO_RNPDNO_CSV_URL` | URL del CSV RNPDNO (búsqueda / inconsistencias) |
| `RASTRO_VAD_BORRADOS_CSV_URL` | CSV nombres borrados |
| `RASTRO_RECONSTRUCCION_AGGREGADOS_URL` | JSON agregados 2017–2024 |
| `RASTRO_RSS_FEEDS` | Feeds RSS separados por coma |
| `RASTRO_MONITOR_KEYWORDS` | Keywords para `/api/monitor` |
| `RASTRO_MONITOR_ESTADOS` | Filtrar monitor por estado |
| `RASTRO_ALERT_WEBHOOK_URL` | Webhook POST al detectar coincidencias |
| `RASTRO_MONITOR_TOKEN` | Token Bearer para disparar webhook en `/api/monitor` |

## Metodología

Ver `/metodologia` en la app o el componente de aviso de uso en el dashboard.

## Docker

```bash
cp .env.template .env
docker compose up -d --build
```

Abre `http://localhost:${RASTRO_PORT:-3000}`.
