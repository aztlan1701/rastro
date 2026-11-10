import { describe, expect, it } from "vitest";
import { aggregateMunicipiosForEstado } from "@/lib/aggregators/rnpdno-municipios";
import {
  buildMunicipioNameIndex,
  normalizeMunicipioName,
  type MunicipioCatalogEntry,
} from "@/lib/geo/municipio-catalog";
import { mergeMunicipioCounts } from "@/lib/geo/municipios-geojson";
import { resolveEstadoToCveEnt } from "@/lib/inegi-codes";
import type { FeatureCollection } from "geojson";
import type { RnpdnoRecord } from "@/lib/types";

const CATALOG: MunicipioCatalogEntry[] = [
  { cvegeo: "14039", nombre: "Guadalajara", cve_ent: "14" },
  { cvegeo: "14120", nombre: "Zapopan", cve_ent: "14" },
  { cvegeo: "14097", nombre: "Tlajomulco de Zúñiga", cve_ent: "14" },
  { cvegeo: "08037", nombre: "Juárez", cve_ent: "08" },
];

function rec(partial: Partial<RnpdnoRecord>): RnpdnoRecord {
  return {
    estadoId: "MX-JAL",
    estado: "Jalisco",
    municipio: "",
    fechaDesaparicion: "",
    estatus: "",
    sexo: "",
    ...partial,
  };
}

describe("normalizeMunicipioName", () => {
  it("quita acentos y prefijos comunes", () => {
    expect(normalizeMunicipioName("Cd. Juárez")).toBe("juarez");
    expect(normalizeMunicipioName("Municipio de Guadalajara")).toBe("guadalajara");
    expect(normalizeMunicipioName("Tlajomulco de Zúñiga")).toBe("tlajomulco de zuniga");
  });
});

describe("resolveEstadoToCveEnt", () => {
  it("acepta id RASTRO y clave INEGI", () => {
    expect(resolveEstadoToCveEnt("MX-JAL")).toBe("14");
    expect(resolveEstadoToCveEnt("14")).toBe("14");
    expect(resolveEstadoToCveEnt("jal")).toBe("14");
    expect(resolveEstadoToCveEnt("xx")).toBeNull();
  });
});

describe("aggregateMunicipiosForEstado", () => {
  it("une por nombre normalizado a CVEGEO dentro de la entidad", () => {
    const records = [
      rec({ municipio: "Guadalajara" }),
      rec({ municipio: "Guadalajara" }),
      rec({ municipio: "Zapopan" }),
      rec({ municipio: "Se Desconoce" }),
      rec({ municipio: "Pueblo Inventado" }),
      rec({ estadoId: "MX-CHH", estado: "Chihuahua", municipio: "Cd. Juárez" }),
    ];

    const result = aggregateMunicipiosForEstado(records, CATALOG, "14");
    expect(result.estadoId).toBe("MX-JAL");
    expect(result.municipios).toHaveLength(2);
    expect(result.municipios[0]).toMatchObject({ cvegeo: "14039", total: 2 });
    expect(result.municipios[1]).toMatchObject({ cvegeo: "14120", total: 1 });
    expect(result.matchedRecords).toBe(3);
    expect(result.unmatchedRecords).toBe(2);
    expect(result.unmatchedSamples).toContain("Pueblo Inventado");
  });

  it("resuelve alias con acentos vía índice", () => {
    const index = buildMunicipioNameIndex(CATALOG, "14");
    expect(index.get(normalizeMunicipioName("Tlajomulco de Zuniga"))?.cvegeo).toBe("14097");
  });
});

describe("mapLiveMunicipiosFromSnapshot", () => {
  it("lee bloque por_municipio y une CVEGEO", async () => {
    const { mapLiveMunicipiosFromSnapshot } = await import(
      "@/lib/aggregators/rnpdno-municipios"
    );
    const snapshot = {
      procedencia: {
        fuente: "test",
        proveedor: "test",
        url: "https://example.com",
        metodo: "test",
        consultado_utc: "2026-09-16T12:00:00+00:00",
        desfase_declarado_por_la_fuente: "n/a",
        alcance: "test",
        peticiones_realizadas: 1,
      },
      datos: {
        por_municipio: [
          {
            clave_inegi: "14",
            id_tablero_estado: "14",
            entidad: "Jalisco",
            municipios: [
              { nombre: "Guadalajara", personas: 100, cvegeo: "14039" },
              { nombre: "Zapopan", personas: 50, cvegeo: null },
            ],
          },
        ],
      },
    };
    const result = mapLiveMunicipiosFromSnapshot(snapshot as never, "14", CATALOG);
    expect(result?.fuente).toBe("cnb-tablero");
    expect(result?.municipios[0].cvegeo).toBe("14039");
    expect(result?.municipios[0].total).toBe(100);
    expect(result?.municipios.some((m) => m.cvegeo === "14120")).toBe(true);
  });
});

describe("mergeMunicipioCounts", () => {
  it("inyecta total y hasData por CVEGEO", () => {
    const geo: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { CVEGEO: "14039", NOM_MUN: "Guadalajara", CVE_ENT: "14" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0],
              ],
            ],
          },
        },
        {
          type: "Feature",
          properties: { CVEGEO: "14120", NOM_MUN: "Zapopan", CVE_ENT: "14" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0],
              ],
            ],
          },
        },
      ],
    };

    const merged = mergeMunicipioCounts(geo, [
      { cvegeo: "14039", nombre: "Guadalajara", estadoId: "MX-JAL", total: 42 },
    ]);

    expect(merged.features[0].properties?.total).toBe(42);
    expect(merged.features[0].properties?.hasData).toBe(true);
    expect(merged.features[1].properties?.total).toBe(0);
    expect(merged.features[1].properties?.hasData).toBe(false);
  });
});
