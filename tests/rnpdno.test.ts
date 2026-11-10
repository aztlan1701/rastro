import { describe, expect, it } from "vitest";
import { aggregateEstados, parseRnpdnoCsv } from "@/lib/aggregators/rnpdno";
import type { RnpdnoRecord } from "@/lib/types";

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

describe("parseRnpdnoCsv", () => {
  it("mapea encabezados con acentos y municipios con comas", () => {
    const csv = [
      "Entidad Federativa,Municipio,Fecha de Desaparición,Estatus,Sexo",
      '"Jalisco","Tlajomulco, centro",2023-09-10,En búsqueda,MUJER',
    ].join("\n");

    const records = parseRnpdnoCsv(csv);
    expect(records).toHaveLength(1);
    expect(records[0].estadoId).toBe("MX-JAL");
    expect(records[0].municipio).toBe("Tlajomulco, centro");
    expect(records[0].sexo).toBe("MUJER");
  });

  it("ignora filas con entidad no reconocida", () => {
    const csv = ["Entidad,Sexo", "Narnia,MUJER", "Jalisco,HOMBRE"].join("\n");
    const records = parseRnpdnoCsv(csv);
    expect(records).toHaveLength(1);
    expect(records[0].estadoId).toBe("MX-JAL");
  });
});

describe("aggregateEstados", () => {
  it("clasifica sexo en tres categorías sin contar desconocidos como hombres", () => {
    const records = [
      rec({ sexo: "MUJER" }),
      rec({ sexo: "HOMBRE" }),
      rec({ sexo: "" }),
      rec({ sexo: "INDETERMINADO" }),
    ];
    const [jal] = aggregateEstados(records);
    expect(jal.total).toBe(4);
    expect(jal.mujeres).toBe(1);
    expect(jal.hombres).toBe(1);
    expect(jal.noEspecificado).toBe(2);
  });

  it("cuenta localizados por estatus", () => {
    const records = [
      rec({ estatus: "Localizada con vida" }),
      rec({ estatus: "En búsqueda" }),
      rec({ estatus: "Encontrado sin vida" }),
    ];
    const [jal] = aggregateEstados(records);
    expect(jal.localizados).toBe(2);
  });

  it("calcula nuevos30d respecto a la fecha más reciente del dataset, no a hoy", () => {
    const records = [
      rec({ fechaDesaparicion: "2023-09-15" }), // referencia (máx)
      rec({ fechaDesaparicion: "2023-09-01" }), // dentro de 30 días
      rec({ fechaDesaparicion: "2023-06-01" }), // fuera de 30 días
    ];
    const [jal] = aggregateEstados(records);
    expect(jal.nuevos30d).toBe(2);
  });

  it("excluye estados sin registros", () => {
    const estados = aggregateEstados([rec({})]);
    expect(estados).toHaveLength(1);
    expect(estados[0].id).toBe("MX-JAL");
  });

  it("elige el municipio con más registros", () => {
    const records = [
      rec({ municipio: "Guadalajara" }),
      rec({ municipio: "Guadalajara" }),
      rec({ municipio: "Zapopan" }),
    ];
    const [jal] = aggregateEstados(records);
    expect(jal.municipioAlto).toBe("Guadalajara");
  });
});
