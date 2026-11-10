import Link from "next/link";
import { THIRD_PARTY_SERVICES, USAGE_DISCLAIMER } from "@/lib/source-catalog";

export function MethodologyPageContent() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 text-ink">
      <h1 className="font-display text-2xl font-black text-ink-strong">Metodología y limitaciones</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-3">
        RASTRO es una plataforma de inteligencia de datos abiertos para ONGs y colectivos de
        personas desaparecidas en México. No almacena casos propios ni sustituye registros
        oficiales.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-ink-strong">Aviso de uso</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-3">{USAGE_DISCLAIMER}</p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-ink-strong">Fuentes principales</h2>
        <ul className="mt-3 space-y-3 text-sm text-ink-3">
          <li>
            <strong className="text-ink-2">RNPDNO agregados (tablero CNB)</strong> — Totales
            estatales y desgloses sociodemográficos del tablero estadístico público. RASTRO usa un
            snapshot JSON regenerable con{" "}
            <code className="text-ink-2">scripts/rnpdno_ingest.py</code> (no consulta el tablero
            en cada visita). Alcance: solo agregados, sin nombres.
          </li>
          <li>
            <strong className="text-ink-2">RNPDNO microdatos (CSV sep 2023)</strong> — Versión
            pública con nombres, replicada por Data Cívica. Alimenta la búsqueda por nombre, la
            auditoría de inconsistencias y la coropleta municipal (conteos por CVEGEO). Corte fijo.
          </li>
          <li>
            <strong className="text-ink-2">Límites municipales (INEGI)</strong> — GeoJSON
            simplificado por entidad (`public/geo/municipios/XX.geojson`), regenerable con{" "}
            <code className="text-ink-2">scripts/build_municipios_geo.py</code>.
          </li>
          <li>
            <strong className="text-ink-2">Volver a Desaparecer</strong> — Reconstrucción de
            nombres borrados y registros enmascarados como ELIMINADO entre versiones del RNPDNO.
          </li>
          <li>
            <strong className="text-ink-2">Noticias y OSINT</strong> — RSS y GDELT con geoparse heurístico. Revise la confianza geográfica antes de usar en campo.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-ink-strong">Terceros</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-3">
          {THIRD_PARTY_SERVICES.map((service) => (
            <li key={service}>{service}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-ink-strong">Limitaciones conocidas</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-3">
          <li>
            El total por estado cuenta personas desaparecidas y no localizadas. En el corte del 16
            de septiembre de 2026, el desglose por sexo y los totales municipales cuentan todos los
            registros, incluidas las personas localizadas, y la interfaz lo señala. Las personas
            localizadas se calculan restando ambas cifras. La ingesta ya solicita el mismo universo
            para todos los bloques; aplicará al regenerar el corte.
          </li>
          <li>
            Mapa y ranking usan agregados del tablero CNB (snapshot). La búsqueda por nombre y las
            inconsistencias siguen en CSV con corte sep 2023 / reconstrucciones Data Cívica.
          </li>
          <li>
            El tablero agregado no publica municipios ni “nuevos 30 días”; esos campos aparecen
            vacíos o en cero en el mapa/informes estatales cuando la fuente es el snapshot vivo.
          </li>
          <li>
            La vista municipal prioriza el snapshot del tablero CNB (`por_municipio`); si falta,
            usa conteos del CSV sep-2023 unidos por nombre a CVEGEO. En entidades grandes el
            tablero suele limitar la serie a los municipios con más casos.
          </li>
          <li>
            La búsqueda por nombre expone datos ya publicados en CSV abiertos; use con
            responsabilidad.
          </li>
          <li>Sin autenticación: no apto para datos no públicos ni casos en curso no publicados.</li>
          <li>
            La consulta automatizada del tablero no es una API oficial documentada: el script puede
            romperse si la CNB cambia la interfaz.
          </li>
        </ul>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/" className="text-[#1f6fd0] underline">
          Volver al dashboard
        </Link>
      </p>
    </div>
  );
}
