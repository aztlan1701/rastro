"use client";

import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildSearchResultsCsv } from "@/lib/export/report";
import type { ApiMeta, EstadoData, PersonSearchResult } from "@/lib/types";
import { ExportButton } from "./ExportButton";
import { SourceMetaBar } from "./SourceMetaBar";
import { TabSectionHeader } from "./TabSectionHeader";

interface SearchTabProps {
  estados: EstadoData[];
  searchMeta?: ApiMeta;
  onSelectEstado: (estado: EstadoData) => void;
  onGoToMap: () => void;
}

const SOURCE_LABELS: Record<PersonSearchResult["source"], string> = {
  rnpdno_publico: "RNPDNO público",
  nombre_borrado: "Nombre borrado",
};

const SOURCE_COLORS: Record<PersonSearchResult["source"], string> = {
  rnpdno_publico: "#4a9eff",
  nombre_borrado: "#ff6b35",
};

export function SearchTab({ estados, searchMeta, onSelectEstado, onGoToMap }: SearchTabProps) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [estadoId, setEstadoId] = useState("");
  const [sexo, setSexo] = useState("");
  const [results, setResults] = useState<PersonSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [meta, setMeta] = useState<ApiMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setTotal(0);
      setMeta(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ q: trimmed });
        if (source !== "all") params.set("source", source);
        if (estadoId) params.set("estadoId", estadoId);
        if (sexo) params.set("sexo", sexo);

        const response = await fetch(`/api/buscar?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as {
          results?: PersonSearchResult[];
          total?: number;
          meta?: ApiMeta;
          error?: string;
        };

        if (!response.ok) throw new Error(data.error ?? "Error de búsqueda");

        setResults(data.results ?? []);
        setTotal(data.total ?? 0);
        setMeta(data.meta ?? null);
        if (data.error && (data.results?.length ?? 0) === 0) setError(data.error);
      } catch (fetchError) {
        if (controller.signal.aborted) return;
        setResults([]);
        setTotal(0);
        setError(fetchError instanceof Error ? fetchError.message : "Error de búsqueda");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, source, estadoId, sexo]);

  const handleOpenEstado = (estadoId?: string) => {
    if (!estadoId) return;
    const estado = estados.find((item) => item.id === estadoId);
    if (!estado) return;
    onSelectEstado(estado);
    onGoToMap();
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <TabSectionHeader
        title="Buscar personas"
        subtitle="Búsqueda por nombre en el RNPDNO público (sep 2023) y en la base de nombres borrados reconstruida por Data Cívica. Mínimo 2 caracteres."
      />

      <SourceMetaBar sourceId="buscar" meta={searchMeta ?? meta ?? { status: "live", fetchedAt: new Date().toISOString() }} />

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <label className="text-[11px] text-[#556070]">
          Fuente
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="mt-1 w-full rounded-sm border border-white/10 bg-[#030508] px-2 py-2 text-[#e8e4dc]"
          >
            <option value="all">Todas</option>
            <option value="rnpdno_publico">RNPDNO público</option>
            <option value="nombre_borrado">Nombre borrado</option>
            <option value="eliminado">Solo ELIMINADO</option>
          </select>
        </label>
        <label className="text-[11px] text-[#556070]">
          Entidad
          <select
            value={estadoId}
            onChange={(event) => setEstadoId(event.target.value)}
            className="mt-1 w-full rounded-sm border border-white/10 bg-[#030508] px-2 py-2 text-[#e8e4dc]"
          >
            <option value="">Todas</option>
            {estados.map((estado) => (
              <option key={estado.id} value={estado.id}>
                {estado.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[11px] text-[#556070]">
          Sexo
          <input
            value={sexo}
            onChange={(event) => setSexo(event.target.value)}
            placeholder="MUJER, HOMBRE…"
            className="mt-1 w-full rounded-sm border border-white/10 bg-[#030508] px-2 py-2 text-[#e8e4dc]"
          />
        </label>
      </div>

      <div className="mb-6">
        <label htmlFor="person-search" className="sr-only">
          Buscar por nombre
        </label>
        <input
          id="person-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Nombre, apellido o nombre completo…"
          autoComplete="off"
          spellCheck={false}
          className="w-full max-w-xl rounded-sm border border-white/10 bg-[#030508] px-4 py-3 text-sm text-[#e8e4dc] placeholder:text-[#556070] focus:border-[#ff2d55]/40 focus:outline-none"
        />
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#556070]">
          {loading ? <span>Buscando…</span> : null}
          {!loading && query.trim().length >= 2 ? (
            <span>
              {total === 0
                ? "Sin coincidencias"
                : `${total.toLocaleString("es-MX")} coincidencia${total === 1 ? "" : "s"}`}
              {total > results.length ? ` · mostrando ${results.length}` : null}
            </span>
          ) : null}
          {meta ? (
            <span className="text-[#3a4558]">
              Fuente: {meta.status === "mock" ? "datos de respaldo" : "Data Cívica"}
            </span>
          ) : null}
          {results.length > 0 ? (
            <ExportButton
              label="Exportar CSV"
              filename={`rastro-busqueda-${query.trim().slice(0, 20)}.csv`}
              content={buildSearchResultsCsv(results)}
            />
          ) : null}
        </div>
      </div>

      {query.trim().length < 2 ? (
        <EmptyState
          title="Escribe un nombre para buscar"
          description="Consulta registros del RNPDNO y nombres borrados entre versiones públicas."
        />
      ) : error && results.length === 0 ? (
        <EmptyState title="No se pudo completar la búsqueda" description={error} />
      ) : results.length === 0 && !loading ? (
        <EmptyState
          title="Sin resultados"
          description={`No hay coincidencias para “${query.trim()}”. Prueba con otro nombre o apellido.`}
        />
      ) : (
        <ul className="space-y-2">
          {results.map((result) => (
            <li
              key={result.id}
              className="rounded-md border border-white/6 bg-white/[0.015] px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-[#e8e4dc]">
                      {result.nombreCompleto}
                    </span>
                    <span
                      className="rounded-sm px-2 py-0.5 text-[11px] tracking-wide uppercase"
                      style={{
                        color: SOURCE_COLORS[result.source],
                        background: `${SOURCE_COLORS[result.source]}15`,
                      }}
                    >
                      {SOURCE_LABELS[result.source]}
                    </span>
                    {result.eliminado ? (
                      <span className="rounded-sm bg-[#ff2d55]/10 px-2 py-0.5 text-[11px] tracking-wide text-[#ff2d55] uppercase">
                        Enmascarado
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#556070]">
                    {result.entidad ? <span>Entidad: {result.entidad}</span> : null}
                    {result.sexo ? <span>Sexo: {result.sexo}</span> : null}
                    {result.edad ? <span>Edad: {result.edad}</span> : null}
                    {result.fecha ? <span>Fecha: {result.fecha}</span> : null}
                  </div>
                </div>
                {result.estadoId ? (
                  <button
                    type="button"
                    onClick={() => handleOpenEstado(result.estadoId)}
                    className="shrink-0 rounded-sm border border-white/10 px-2.5 py-1 text-[11px] text-[#aaa] transition-colors hover:bg-white/5"
                  >
                    Ver en mapa
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
