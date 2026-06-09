import { getSearchIndex } from "@/lib/search/person-search";
import type { InconsistencyRecord, InconsistencyType } from "@/lib/types";

export interface InconsistenciesResponse {
  records: InconsistencyRecord[];
  total: number;
  summary: {
    eliminados: number;
    borrados: number;
    borradosSinEntidad: number;
  };
  usedMock: boolean;
}

function classifyInconsistency(person: {
  eliminado: boolean;
  source: "rnpdno_publico" | "nombre_borrado";
  entidad: string;
  estadoId?: string;
}): InconsistencyType | null {
  if (person.eliminado) return "eliminado";
  if (person.source === "nombre_borrado") {
    if (!person.estadoId || person.entidad.toLowerCase().includes("desconoce")) {
      return "borrado_sin_entidad";
    }
    return "borrado";
  }
  return null;
}

export async function getInconsistencies(
  limit = 50,
  estadoId?: string,
): Promise<InconsistenciesResponse> {
  const { people, usedMock } = await getSearchIndex();

  const filtered = people
    .filter((person) => (estadoId ? person.estadoId === estadoId : true))
    .map((person) => {
      const type = classifyInconsistency(person);
      if (!type) return null;
      return {
        id: person.id,
        type,
        nombreCompleto: person.nombreCompleto,
        entidad: person.entidad,
        estadoId: person.estadoId,
        sexo: person.sexo || undefined,
        fecha: person.fecha || undefined,
        source: person.source,
      } satisfies InconsistencyRecord;
    })
    .filter(Boolean) as InconsistencyRecord[];

  const summary = {
    eliminados: filtered.filter((item) => item.type === "eliminado").length,
    borrados: filtered.filter((item) => item.type === "borrado").length,
    borradosSinEntidad: filtered.filter((item) => item.type === "borrado_sin_entidad").length,
  };

  return {
    records: filtered.slice(0, limit),
    total: filtered.length,
    summary,
    usedMock,
  };
}
