import { fetchMunicipiosAggForEstado } from "@/lib/aggregators/rnpdno-municipios";
import { buildMeta, jsonResponse } from "@/lib/api-response";
import { withCache } from "@/lib/cache";
import { CACHE_STALE, CACHE_TTL } from "@/lib/config";

/**
 * Agregados municipales: snapshot CNB (`por_municipio` del ingest) con
 * respaldo CSV sep-2023. Query: `?estado=MX-JAL` o `?estado=14`
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estado = searchParams.get("estado")?.trim() ?? "";
    if (!estado) {
      return jsonResponse(
        { error: "Parámetro requerido: estado (MX-JAL o clave INEGI 01–32)" },
        { status: 400 },
      );
    }

    const entry = await withCache(
      `rnpdno-municipios:${estado.toUpperCase()}`,
      CACHE_TTL.rnpdno,
      CACHE_STALE.rnpdno,
      async () => {
        const result = await fetchMunicipiosAggForEstado(estado);
        if (!result) {
          return {
            data: null as Awaited<ReturnType<typeof fetchMunicipiosAggForEstado>>,
            status: "mock" as const,
            source: "invalid-estado",
          };
        }
        return {
          data: result,
          status: "live" as const,
          source: `${result.fuente}@${result.corte}`,
        };
      },
    );

    if (!entry.data) {
      return jsonResponse(
        { error: `Estado no reconocido: ${estado}` },
        { status: 400 },
      );
    }

    const { municipios, matchedRecords, unmatchedRecords, unmatchedSamples, ...rest } =
      entry.data;

    return jsonResponse({
      ...rest,
      municipios,
      join: {
        matchedRecords,
        unmatchedRecords,
        unmatchedSamples,
      },
      meta: {
        ...buildMeta(entry.status, entry.fetchedAt, entry.source),
        fuenteMunicipios: rest.fuente,
        fuenteEstados: "cnb-tablero",
        nota: rest.nota,
      },
    });
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Municipios error" },
      { status: 500 },
    );
  }
}
