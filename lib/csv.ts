/**
 * Parser CSV compatible con RFC 4180.
 *
 * A diferencia de un `split(",")` ingenuo, maneja correctamente:
 *  - campos entrecomillados que contienen comas: `"García, Juan"`
 *  - comillas escapadas dentro de un campo: `"dijo ""presente"""`
 *  - saltos de línea (CR/LF) dentro de un campo entrecomillado
 *  - finales de línea mixtos (\n y \r\n)
 *
 * Esto es crítico para RASTRO porque los CSV del RNPDNO y de Data Cívica
 * contienen nombres, apellidos y municipios con comas y comillas: un parser
 * por líneas corrompe filas en silencio y desplaza columnas.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  // Quitar BOM inicial si existe.
  if (text.charCodeAt(0) === 0xfeff) i = 1;

  while (i < len) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }

    if (char === "\n" || char === "\r") {
      // Consumir \r\n como un solo salto.
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  // Último campo / fila si el archivo no termina en salto de línea.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Descartar filas completamente vacías (p. ej. línea final en blanco).
  return rows.filter((r) => r.some((value) => value.trim() !== ""));
}

/** Normaliza un encabezado: sin acentos, minúsculas, separadores a `_`. */
export function normalizeHeader(header: string): string {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Busca el índice de una columna probando candidatos en orden. Primero intenta
 * coincidencia exacta del encabezado normalizado y luego parcial (startsWith /
 * includes), lo que tolera variaciones de nombres entre versiones del dataset.
 */
export function findColumn(headers: string[], candidates: string[]): number {
  for (const candidate of candidates) {
    const exact = headers.indexOf(candidate);
    if (exact >= 0) return exact;

    const partial = headers.findIndex(
      (header) => header.startsWith(candidate) || header.includes(candidate),
    );
    if (partial >= 0) return partial;
  }
  return -1;
}

/** Devuelve la celda en `index` ya recortada, o "" si el índice es inválido. */
export function cell(cols: string[], index: number): string {
  if (index < 0) return "";
  return (cols[index] ?? "").trim();
}
