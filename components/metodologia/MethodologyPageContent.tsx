import Link from "next/link";
import { THIRD_PARTY_SERVICES, USAGE_DISCLAIMER } from "@/lib/source-catalog";

export function MethodologyPageContent() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 text-[#e8e4dc]">
      <h1 className="font-display text-2xl font-black text-white">Metodología y limitaciones</h1>
      <p className="mt-3 text-sm leading-relaxed text-[#aaa]">
        RASTRO es una plataforma de inteligencia de datos abiertos para ONGs y colectivos de
        personas desaparecidas en México. No almacena casos propios ni sustituye registros
        oficiales.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-white">Aviso de uso</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#aaa]">{USAGE_DISCLAIMER}</p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-white">Fuentes principales</h2>
        <ul className="mt-3 space-y-3 text-sm text-[#aaa]">
          <li>
            <strong className="text-[#d4d0c8]">RNPDNO versión pública (sep 2023)</strong> — CSV
            publicado por la CNB, replicado por Data Cívica. Corte fijo; puede no reflejar
            registros recientes.
          </li>
          <li>
            <strong className="text-[#d4d0c8]">Volver a Desaparecer</strong> — Reconstrucción de
            nombres borrados y registros enmascarados como ELIMINADO entre versiones del RNPDNO.
          </li>
          <li>
            <strong className="text-[#d4d0c8]">Alertas AMBER</strong> — Modo demostración con
            datos ficticios. Consulte siempre{" "}
            <a
              href="https://alertaamber.fgr.org.mx/"
              className="text-[#4a9eff] underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              alertaamber.fgr.org.mx
            </a>
            .
          </li>
          <li>
            <strong className="text-[#d4d0c8]">Noticias y OSINT</strong> — RSS, GDELT y Telegram
            público con geoparse heurístico. Revise la confianza geográfica antes de usar en campo.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-white">Terceros</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#aaa]">
          {THIRD_PARTY_SERVICES.map((service) => (
            <li key={service}>{service}</li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-white">Limitaciones conocidas</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#aaa]">
          <li>Datos RNPDNO con corte sep 2023; no reflejan cambios posteriores del registro.</li>
          <li>Municipios en mapa son puntos aproximados cuando no hay coordenadas oficiales.</li>
          <li>
            La búsqueda por nombre expone datos ya publicados en CSV abiertos; use con
            responsabilidad.
          </li>
          <li>Sin autenticación: no apto para datos no públicos ni casos en curso no publicados.</li>
        </ul>
      </section>

      <p className="mt-10 text-sm">
        <Link href="/" className="text-[#4a9eff] underline">
          Volver al dashboard
        </Link>
      </p>
    </div>
  );
}
