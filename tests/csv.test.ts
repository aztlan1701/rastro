import { describe, expect, it } from "vitest";
import { cell, findColumn, normalizeHeader, parseCsv } from "@/lib/csv";

describe("parseCsv", () => {
  it("parsea filas y columnas simples", () => {
    const rows = parseCsv("a,b,c\n1,2,3");
    expect(rows).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("respeta comas dentro de campos entrecomillados", () => {
    const rows = parseCsv('nombre,entidad\n"García, Juan",Jalisco');
    expect(rows[1]).toEqual(["García, Juan", "Jalisco"]);
  });

  it("maneja comillas escapadas (\"\")", () => {
    const rows = parseCsv('texto\n"dijo ""presente"" hoy"');
    expect(rows[1]).toEqual(['dijo "presente" hoy']);
  });

  it("permite saltos de línea dentro de un campo entrecomillado", () => {
    const rows = parseCsv('a,b\n"línea1\nlínea2",fin');
    expect(rows).toHaveLength(2);
    expect(rows[1]).toEqual(["línea1\nlínea2", "fin"]);
  });

  it("soporta finales de línea CRLF", () => {
    const rows = parseCsv("a,b\r\n1,2\r\n3,4");
    expect(rows).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("descarta filas completamente vacías y BOM inicial", () => {
    const rows = parseCsv("﻿a,b\n\n1,2\n");
    expect(rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("normalizeHeader", () => {
  it("quita acentos, baja a minúsculas y normaliza separadores", () => {
    expect(normalizeHeader("Entidad Federativa")).toBe("entidad_federativa");
    expect(normalizeHeader("Fecha de Desaparición")).toBe("fecha_de_desaparicion");
  });
});

describe("findColumn", () => {
  const headers = ["consecutivo", "entidad_federativa_de_ocurrencia", "sexo"];

  it("encuentra por coincidencia exacta", () => {
    expect(findColumn(headers, ["sexo"])).toBe(2);
  });

  it("encuentra por coincidencia parcial cuando no hay exacta", () => {
    expect(findColumn(headers, ["entidad_federativa"])).toBe(1);
  });

  it("devuelve -1 cuando no hay candidato", () => {
    expect(findColumn(headers, ["municipio"])).toBe(-1);
  });
});

describe("cell", () => {
  it("recorta y maneja índices inválidos", () => {
    expect(cell(["  hola  ", "x"], 0)).toBe("hola");
    expect(cell(["a"], -1)).toBe("");
    expect(cell(["a"], 5)).toBe("");
  });
});
