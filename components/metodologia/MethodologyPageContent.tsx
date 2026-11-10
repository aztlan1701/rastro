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
            <strong className="text-[#d4d0c8]">Noticias y OSINT</strong> — RSS y GDELT con
            geoparse heurístico. Revise la confianza geográfica antes de usar en campo.
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

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-white">Salvaguardas</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#aaa]">
          <li>RASTRO no permite alta ni edición de casos y no guarda las consultas de búsqueda.</li>
          <li>
            La búsqueda por nombre y la lista de inconsistencias devuelven como máximo 100
            registros por consulta, con un límite de 30 consultas por minuto por dirección IP.
          </li>
          <li>
            Los informes por estado contienen solo cifras agregadas, se limitan a 10 por minuto y
            escapan todo valor insertado para que el navegador lo lea como texto.
          </li>
          <li>
            Las respuestas de búsqueda, inconsistencias, informes y monitoreo incluyen la cabecera
            X-Robots-Tag para evitar su indexación.
          </li>
          <li>
            El monitoreo solo envía avisos al webhook cuando el operador configuró un token y la
            petición lo presenta; sin token, ninguna petición pública puede dispararlo.
          </li>
          <li>
            Las consultas a fuentes externas se identifican con un agente que enlaza al
            repositorio del proyecto.
          </li>
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
