import { describe, expect, it } from "vitest";
import {
  mapAgregadosToEstados,
  type RnpdnoAgregadosSnapshot,
} from "@/lib/aggregators/rnpdno-live";
import snapshotJson from "../public/data/rnpdno-agregados.json";

const PROCEDENCIA: RnpdnoAgregadosSnapshot["procedencia"] = {
  fuente: "prueba",
  proveedor: "prueba",
  url: "https://example.org",
  metodo: "prueba",
  consultado_utc: "2026-09-16T00:00:00+00:00",
  desfase_declarado_por_la_fuente: "n/a",
  alcance: "prueba",
  peticiones_realizadas: 0,
};

function snapshot(datos: RnpdnoAgregadosSnapshot["datos"]): RnpdnoAgregadosSnapshot {
  return { procedencia: PROCEDENCIA, datos };
}

const POR_ENTIDAD = [
  { clave_inegi: "14", clave_tablero: "mx-ja", entidad: "Jalisco", personas: 100 },
];

describe("mapAgregadosToEstados", () => {
  it("rotula el sexo como 'todos' y deriva localizadas cuando solo hay registros totales", () => {
    const [jal] = mapAgregadosToEstados(
      snapshot({
        por_entidad: POR_ENTIDAD,
        por_entidad_y_sexo: [
          { serie: "Hombre", valores: [{ categoria: "JALISCO", personas: 180 }] },
          { serie: "Mujer", valores: [{ categoria: "JALISCO", personas: 60 }] },
          { serie: "Indeterminado", valores: [{ categoria: "JALISCO", personas: 10 }] },
        ],
      }),
    );

    expect(jal.total).toBe(100);
    expect(jal.sexoUniverso).toBe("todos");
    expect(jal.hombres + jal.mujeres + jal.noEspecificado).toBe(250);
    expect(jal.localizados).toBe(150);
    expect(jal.nuevos30d).toBeNull();
  });

  it("usa el desglose de desaparecidas cuando el snapshot lo trae", () => {
    const [jal] = mapAgregadosToEstados(
      snapshot({
        por_entidad: POR_ENTIDAD,
        por_entidad_y_sexo: [
          { serie: "Hombre", valores: [{ categoria: "JALISCO", personas: 180 }] },
          { serie: "Mujer", valores: [{ categoria: "JALISCO", personas: 70 }] },
        ],
        por_entidad_y_sexo_desaparecidas: [
          { serie: "Hombre", valores: [{ categoria: "JALISCO", personas: 75 }] },
          { serie: "Mujer", valores: [{ categoria: "JALISCO", personas: 25 }] },
        ],
      }),
    );

    expect(jal.sexoUniverso).toBe("desaparecidas");
    expect(jal.hombres + jal.mujeres).toBe(jal.total);
    expect(jal.localizados).toBe(150);
  });

  it("deja localizadas sin dato si falta el bloque o la resta no es coherente", () => {
    const [sinBloque] = mapAgregadosToEstados(snapshot({ por_entidad: POR_ENTIDAD }));
    expect(sinBloque.localizados).toBeNull();

    const [incoherente] = mapAgregadosToEstados(
      snapshot({
        por_entidad: POR_ENTIDAD,
        por_entidad_y_sexo: [
          { serie: "Hombre", valores: [{ categoria: "JALISCO", personas: 40 }] },
        ],
      }),
    );
    expect(incoherente.localizados).toBeNull();
  });
});

describe("snapshot versionado del tablero", () => {
  const real = snapshotJson as unknown as RnpdnoAgregadosSnapshot;
  const estados = mapAgregadosToEstados(real);

  it("cubre las 32 entidades con localizadas calculables", () => {
    expect(estados).toHaveLength(32);
    expect(estados.every((estado) => estado.localizados !== null)).toBe(true);
  });

  it("las localizadas derivadas reproducen el total nacional del tablero", () => {
    const totales = real.datos.totales ?? {};
    const sinEntidad = (real.datos.por_entidad ?? []).filter((fila) => !fila.clave_inegi);
    // Los registros sin entidad determinada no entran en ningún estado.
    const desaparecidasSinEntidad = sinEntidad.reduce((s, fila) => s + (fila.personas ?? 0), 0);
    const desaparecidas = estados.reduce((s, estado) => s + estado.total, 0);
    expect(desaparecidas + desaparecidasSinEntidad).toBe(totales.desaparecidos_y_no_localizados);

    const localizadas = estados.reduce((s, estado) => s + (estado.localizados ?? 0), 0);
    const diferencia = Math.abs(localizadas - (totales.localizados ?? 0));
    // Tolerancia: registros localizados cuya entidad no corresponde a ningún estado.
    expect(diferencia / (totales.localizados ?? 1)).toBeLessThan(0.02);
  });
});
