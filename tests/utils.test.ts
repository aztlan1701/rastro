import { describe, expect, it } from "vitest";
import { escapeHtml, safeHttpUrl } from "@/lib/utils";

describe("escapeHtml", () => {
  it("neutraliza marcado peligroso", () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
    expect(escapeHtml("a & b")).toBe("a &amp; b");
    expect(escapeHtml("O'Brien")).toBe("O&#39;Brien");
  });

  it("maneja null/undefined sin romper", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});

describe("safeHttpUrl", () => {
  it("acepta http y https", () => {
    expect(safeHttpUrl("https://ejemplo.com/a")).toBe("https://ejemplo.com/a");
    expect(safeHttpUrl("http://ejemplo.com")).toBe("http://ejemplo.com/");
  });

  it("rechaza esquemas peligrosos", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeHttpUrl("data:text/html,<script>1</script>")).toBeUndefined();
    expect(safeHttpUrl("  vbscript:msgbox(1)  ")).toBeUndefined();
  });

  it("rechaza vacíos y URLs inválidas", () => {
    expect(safeHttpUrl("")).toBeUndefined();
    expect(safeHttpUrl(undefined)).toBeUndefined();
    expect(safeHttpUrl("no-es-una-url")).toBeUndefined();
  });
});
