"""
rnpdno_ingest.py — Ingesta automatizada de agregados del RNPDNO (versión pública)

Consulta el tablero estadístico público de la Comisión Nacional de Búsqueda
mediante los mismos puntos finales que usa la interfaz web, obteniendo datos
con el mismo desfase que la consulta manual (no mayor a cinco minutos según
el aviso del sitio).

ALCANCE: únicamente agregados estadísticos. Este módulo no obtiene, no
almacena y no puede obtener datos nominales: el tablero público no los expone.

SALVAGUARDAS DE DISEÑO (condición C5):
  - Intervalo mínimo entre peticiones, configurable, por defecto 1.5 s.
  - Identificación explícita del agente en la cabecera User-Agent.
  - Reintentos acotados con espera creciente; nunca en ráfaga.
  - Sin paralelismo: una petición a la vez.
  - Corte duro de peticiones por ejecución.

Uso:
    python rnpdno_ingest.py --salida agregados.json
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests

BASE = "https://versionpublicarnpdno.segob.gob.mx"

AGENTE = (
    "RASTRO/1.0 (herramienta civica de datos abiertos; "
    "contacto: jmontielromero@icloud.com) requests"
)

# Clave de dos letras del tablero -> clave INEGI de entidad federativa
CLAVE_ENTIDAD = {
    "mx-ag": "01", "mx-bc": "02", "mx-bs": "03", "mx-cm": "04",
    "mx-co": "05", "mx-cl": "06", "mx-cs": "07", "mx-ch": "08",
    "mx-df": "09", "mx-dg": "10", "mx-gj": "11", "mx-gr": "12",
    "mx-hg": "13", "mx-ja": "14", "mx-mx": "15", "mx-mi": "16",
    "mx-mo": "17", "mx-na": "18", "mx-nl": "19", "mx-oa": "20",
    "mx-pu": "21", "mx-qt": "22", "mx-qr": "23", "mx-sl": "24",
    "mx-si": "25", "mx-so": "26", "mx-tb": "27", "mx-tm": "28",
    "mx-tl": "29", "mx-ve": "30", "mx-yu": "31", "mx-za": "32",
}

NOMBRE_ENTIDAD = {
    "01": "Aguascalientes", "02": "Baja California", "03": "Baja California Sur",
    "04": "Campeche", "05": "Coahuila", "06": "Colima", "07": "Chiapas",
    "08": "Chihuahua", "09": "Ciudad de México", "10": "Durango",
    "11": "Guanajuato", "12": "Guerrero", "13": "Hidalgo", "14": "Jalisco",
    "15": "México", "16": "Michoacán", "17": "Morelos", "18": "Nayarit",
    "19": "Nuevo León", "20": "Oaxaca", "21": "Puebla", "22": "Querétaro",
    "23": "Quintana Roo", "24": "San Luis Potosí", "25": "Sinaloa",
    "26": "Sonora", "27": "Tabasco", "28": "Tamaulipas", "29": "Tlaxcala",
    "30": "Veracruz", "31": "Yucatán", "32": "Zacatecas",
}

# Filtros neutros: sin recorte por estatus, territorio, fecha ni edad.
FILTRO_NEUTRO: dict[str, str] = {
    "titulo": "",
    "subtitulo": "",
    "idEstatusVictima": "0",
    "fechaInicio": "",
    "fechaFin": "",
    "idEstado": "0",
    "idMunicipio": "0",
    "idNacionalidad": "0",
    "idColonia": "0",
    "edadInicial": "0",
    "edadFinal": "0",
    "mostrarFechaNull": "0",
    "mostrarEdadNull": "0",
}


class ErrorIngesta(RuntimeError):
    """Falla irrecuperable durante la ingesta."""


@dataclass
class Cliente:
    """Cliente de consulta con control de ritmo y tope de peticiones."""

    intervalo: float = 1.5
    tope_peticiones: int = 60
    reintentos: int = 3
    tiempo_espera: int = 30

    sesion: requests.Session = field(default_factory=requests.Session, init=False)
    _peticiones: int = field(default=0, init=False)
    _ultima: float = field(default=0.0, init=False)

    def __post_init__(self) -> None:
        self.sesion.headers.update({
            "User-Agent": AGENTE,
            "Accept-Language": "es-MX,es;q=0.9",
        })

    # -- ritmo ----------------------------------------------------------------
    def _esperar_turno(self) -> None:
        if self._peticiones >= self.tope_peticiones:
            raise ErrorIngesta(
                f"Tope de {self.tope_peticiones} peticiones alcanzado. "
                "Se detiene la ingesta por diseño."
            )
        transcurrido = time.monotonic() - self._ultima
        if transcurrido < self.intervalo:
            time.sleep(self.intervalo - transcurrido)
        self._ultima = time.monotonic()
        self._peticiones += 1

    # -- sesión ---------------------------------------------------------------
    def abrir_sesion(self) -> None:
        """Establece la sesión recorriendo el aviso y las vistas del tablero."""
        self._esperar_turno()
        self.sesion.get(f"{BASE}/", timeout=self.tiempo_espera)

        self._esperar_turno()
        respuesta = self.sesion.get(
            f"{BASE}/Dashboard/ContextoGeneral",
            headers={"Referer": f"{BASE}/"},
            timeout=self.tiempo_espera,
        )
        if respuesta.status_code != 200:
            raise ErrorIngesta(
                f"No fue posible abrir la sesión (HTTP {respuesta.status_code})."
            )

        # Necesario para BarChartSexoMunicipio y catálogos sociodemográficos.
        self._esperar_turno()
        socio = self.sesion.get(
            f"{BASE}/Dashboard/Sociodemografico",
            headers={"Referer": f"{BASE}/Dashboard/ContextoGeneral"},
            timeout=self.tiempo_espera,
        )
        if socio.status_code != 200:
            raise ErrorIngesta(
                f"No fue posible abrir Sociodemografico (HTTP {socio.status_code})."
            )

    # -- peticiones -----------------------------------------------------------
    def _post(
        self,
        ruta: str,
        *,
        cuerpo_json: dict[str, str] | None = None,
        referer: str,
    ) -> Any:
        cabeceras = {
            "X-Requested-With": "XMLHttpRequest",
            "Referer": f"{BASE}{referer}",
        }
        if cuerpo_json is None:
            cabeceras["Content-Type"] = (
                "application/x-www-form-urlencoded; charset=UTF-8"
            )
            datos: dict[str, Any] = {"data": ""}
            envio = {"data": datos}
        else:
            cabeceras["Content-Type"] = "application/json; charset=utf-8"
            envio = {"data": json.dumps(cuerpo_json, ensure_ascii=False)}

        ultimo_error: Exception | None = None
        for intento in range(1, self.reintentos + 1):
            self._esperar_turno()
            try:
                respuesta = self.sesion.post(
                    f"{BASE}{ruta}",
                    headers=cabeceras,
                    timeout=self.tiempo_espera,
                    **envio,
                )
                if respuesta.status_code != 200:
                    raise ErrorIngesta(f"HTTP {respuesta.status_code} en {ruta}")
                texto = respuesta.text.lstrip()
                if not texto.startswith(("{", "[")):
                    raise ErrorIngesta(
                        f"{ruta} devolvió contenido no JSON "
                        "(posible expiración de sesión)."
                    )
                return respuesta.json()
            except (requests.RequestException, ErrorIngesta, ValueError) as exc:
                ultimo_error = exc
                if intento < self.reintentos:
                    time.sleep(self.intervalo * (2 ** intento))

        raise ErrorIngesta(f"Falló {ruta} tras {self.reintentos} intentos: {ultimo_error}")

    def post_formulario(self, ruta: str) -> Any:
        return self._post(ruta, referer="/Dashboard/ContextoGeneral")

    def post_json(self, ruta: str, cuerpo: dict[str, str]) -> Any:
        return self._post(ruta, cuerpo_json=cuerpo, referer="/Dashboard/Sociodemografico")


# -- normalización ------------------------------------------------------------
def _entero(valor: Any) -> int | None:
    if valor is None:
        return None
    try:
        return int(str(valor).replace(",", "").replace("%", "").strip())
    except ValueError:
        return None


def obtener_totales(cliente: Cliente) -> dict[str, Any]:
    crudo = cliente.post_formulario("/ContextoGeneral/Totales")
    return {
        "total_global": _entero(crudo.get("TotalGlobal")),
        "desaparecidos_y_no_localizados": _entero(crudo.get("TotalDesaparecidos")),
        "localizados": _entero(crudo.get("TotalLocalizados")),
        "solo_desaparecidos": _entero(crudo.get("TotalSoloDesaparecidos")),
        "solo_no_localizados": _entero(crudo.get("TotalSoloNoLocalizados")),
        "localizados_con_vida": _entero(crudo.get("TotalLocalizadosCV")),
        "localizados_sin_vida": _entero(crudo.get("TotalLocalizadosSV")),
    }


def obtener_entidades(cliente: Cliente) -> list[dict[str, Any]]:
    crudo = cliente.post_formulario("/ContextoGeneral/MapChartEntidades")
    filas: list[dict[str, Any]] = []
    for elemento in crudo.get("Series", []):
        if not isinstance(elemento, list) or len(elemento) < 2:
            continue
        clave_mapa, valor = elemento[0], elemento[1]
        clave_inegi = CLAVE_ENTIDAD.get(clave_mapa)
        if clave_inegi is None:
            filas.append({
                "clave_inegi": None,
                "clave_tablero": clave_mapa,
                "entidad": "Sin entidad determinada o extranjero",
                "personas": _entero(valor),
            })
            continue
        filas.append({
            "clave_inegi": clave_inegi,
            "clave_tablero": clave_mapa,
            "entidad": NOMBRE_ENTIDAD[clave_inegi],
            "personas": _entero(valor),
        })
    filas.sort(key=lambda f: (f["personas"] is None, -(f["personas"] or 0)))
    return filas


def _serie_por_categoria(crudo: dict[str, Any]) -> list[dict[str, Any]]:
    categorias = crudo.get("XAxisCategories") or []
    salida: list[dict[str, Any]] = []
    for serie in crudo.get("Series", []):
        datos = serie.get("data") or []
        salida.append({
            "serie": serie.get("name"),
            "valores": [
                {"categoria": cat, "personas": _entero(val)}
                for cat, val in zip(categorias, datos)
            ],
        })
    return salida


def obtener_por_anio(cliente: Cliente) -> list[dict[str, Any]]:
    cuerpo = dict(FILTRO_NEUTRO, subtitulo="POR AÑO")
    crudo = cliente.post_json("/SocioDemografico/AreaChartSexoAnio", cuerpo)
    return _serie_por_categoria(crudo)


def obtener_por_rango_edad(cliente: Cliente) -> list[dict[str, Any]]:
    cuerpo = dict(FILTRO_NEUTRO, subtitulo="POR RANGO DE EDAD")
    crudo = cliente.post_json("/SocioDemografico/AreaChartSexoRango", cuerpo)
    return _serie_por_categoria(crudo)


def obtener_por_entidad_y_sexo(cliente: Cliente) -> list[dict[str, Any]]:
    cuerpo = dict(FILTRO_NEUTRO, subtitulo="POR ENTIDAD")
    crudo = cliente.post_json("/SocioDemografico/BarChartSexoEstados", cuerpo)
    return _serie_por_categoria(crudo)


def _normalizar_nombre_municipio(raw: str) -> str:
    import unicodedata
    import re

    texto = unicodedata.normalize("NFD", raw)
    texto = "".join(ch for ch in texto if unicodedata.category(ch) != "Mn")
    texto = texto.lower()
    texto = re.sub(r"\b(municipio|alcaldia|delegacion)\s+(de\s+)?", "", texto)
    texto = re.sub(r"\b(cd\.?|ciudad)\s+", "", texto)
    texto = re.sub(r"[^a-z0-9\s]", " ", texto)
    return re.sub(r"\s+", " ", texto).strip()


_IGNORAR_MUNICIPIO = {
    "",
    "se desconoce",
    "sin municipio de referencia",
    "no especificado",
    "sin dato",
}


def _cargar_indice_cvegeo(catalogo_path: Path) -> dict[str, dict[str, str]]:
    """cve_ent -> {nombre_normalizado: cvegeo}."""
    if not catalogo_path.is_file():
        return {}
    doc = json.loads(catalogo_path.read_text(encoding="utf-8"))
    indice: dict[str, dict[str, str]] = {}
    for row in doc.get("municipios") or []:
        cve_ent = str(row.get("cve_ent") or "")
        nombre = _normalizar_nombre_municipio(str(row.get("nombre") or ""))
        cvegeo = str(row.get("cvegeo") or "")
        if not cve_ent or not nombre or len(cvegeo) != 5:
            continue
        indice.setdefault(cve_ent, {}).setdefault(nombre, cvegeo)
    return indice


def _resolver_cvegeo(por_nombre: dict[str, str], clave: str) -> str | None:
    if not clave:
        return None
    if clave in por_nombre:
        return por_nombre[clave]
    hits = [
        cvegeo
        for nombre, cvegeo in por_nombre.items()
        if clave in nombre or nombre in clave
    ]
    if len(hits) == 1:
        return hits[0]
    return None


def obtener_por_municipio_por_entidad(
    cliente: Cliente,
    *,
    catalogo_path: Path,
) -> list[dict[str, Any]]:
    """
    Una petición por entidad a BarChartSexoMunicipio.

    El tablero suele devolver todos los municipios en entidades pequeñas y
    ~top 30 en las grandes. Los nombres se unen a CVEGEO vía el catálogo local.
    """
    indice = _cargar_indice_cvegeo(catalogo_path)
    salida: list[dict[str, Any]] = []

    for n in range(1, 33):
        cve_ent = f"{n:02d}"
        cuerpo = dict(FILTRO_NEUTRO, subtitulo="POR MUNICIPIO", idEstado=str(n))
        crudo = cliente.post_json("/SocioDemografico/BarChartSexoMunicipio", cuerpo)
        categorias = crudo.get("XAxisCategories") or []
        series = crudo.get("Series") or []
        por_nombre = indice.get(cve_ent, {})

        municipios: list[dict[str, Any]] = []
        sin_match: list[str] = []
        for i, nombre in enumerate(categorias):
            nombre_str = str(nombre)
            clave = _normalizar_nombre_municipio(nombre_str)
            if clave in _IGNORAR_MUNICIPIO:
                continue
            total = 0
            for serie in series:
                datos = serie.get("data") or []
                if i < len(datos):
                    val = _entero(datos[i])
                    if val is not None:
                        total += val
            cvegeo = _resolver_cvegeo(por_nombre, clave)
            fila: dict[str, Any] = {
                "nombre": nombre_str,
                "personas": total,
                "cvegeo": cvegeo,
            }
            municipios.append(fila)
            if cvegeo is None:
                sin_match.append(nombre_str)

        municipios.sort(key=lambda m: (m["personas"] is None, -(m["personas"] or 0)))
        salida.append({
            "clave_inegi": cve_ent,
            "id_tablero_estado": str(n),
            "entidad": NOMBRE_ENTIDAD[cve_ent],
            "municipios": municipios,
            "sin_match": sin_match,
            "nota": (
                "Serie del tablero (BarChartSexoMunicipio); en entidades grandes "
                "suele limitarse a los municipios con más registros."
            ),
        })

    return salida


# -- orquestación -------------------------------------------------------------
def ingerir(
    intervalo: float = 1.5,
    *,
    con_municipios: bool = True,
    catalogo_path: Path | None = None,
    tope_peticiones: int = 80,
) -> dict[str, Any]:
    cliente = Cliente(intervalo=intervalo, tope_peticiones=tope_peticiones)
    cliente.abrir_sesion()

    consultado = datetime.now(timezone.utc).isoformat()

    bloques: dict[str, Any] = {}
    fallas: dict[str, str] = {}

    tareas = {
        "totales": obtener_totales,
        "por_entidad": obtener_entidades,
        "por_anio_y_sexo": obtener_por_anio,
        "por_rango_edad_y_sexo": obtener_por_rango_edad,
        "por_entidad_y_sexo": obtener_por_entidad_y_sexo,
    }
    for nombre, funcion in tareas.items():
        try:
            bloques[nombre] = funcion(cliente)
        except ErrorIngesta as exc:
            fallas[nombre] = str(exc)

    if con_municipios:
        cat = catalogo_path or (
            Path(__file__).resolve().parents[1] / "public/data/municipios-catalogo.json"
        )
        try:
            bloques["por_municipio"] = obtener_por_municipio_por_entidad(
                cliente, catalogo_path=cat,
            )
        except ErrorIngesta as exc:
            fallas["por_municipio"] = str(exc)

    if not bloques:
        raise ErrorIngesta(f"Ningún bloque pudo obtenerse. Detalle: {fallas}")

    alcance = (
        "Agregados estadísticos estatales"
        + (" y municipales (serie del tablero por entidad)" if con_municipios else "")
        + ". No incluye datos nominales."
    )

    return {
        "procedencia": {
            "fuente": "Versión pública estadística del RNPDNO",
            "proveedor": "Comisión Nacional de Búsqueda (CNB)",
            "url": BASE,
            "metodo": "Consulta automatizada de los puntos finales del tablero público",
            "consultado_utc": consultado,
            "desfase_declarado_por_la_fuente": "no mayor a cinco minutos",
            "alcance": alcance,
            "peticiones_realizadas": cliente._peticiones,
        },
        "datos": bloques,
        "bloques_no_obtenidos": fallas,
    }


def main() -> int:
    analizador = argparse.ArgumentParser(
        description="Ingesta de agregados públicos del RNPDNO para RASTRO."
    )
    analizador.add_argument(
        "--salida", default="rnpdno_agregados.json",
        help="Ruta del archivo JSON de salida.",
    )
    analizador.add_argument(
        "--intervalo", type=float, default=1.5,
        help="Segundos mínimos entre peticiones (por defecto 1.5).",
    )
    analizador.add_argument(
        "--sin-municipios",
        action="store_true",
        help="Omite el bloque municipal (ahorra ~32 peticiones).",
    )
    analizador.add_argument(
        "--catalogo",
        type=Path,
        default=None,
        help="Ruta a municipios-catalogo.json para unir CVEGEO.",
    )
    analizador.add_argument(
        "--tope",
        type=int,
        default=80,
        help="Tope de peticiones por ejecución (por defecto 80).",
    )
    argumentos = analizador.parse_args()

    try:
        resultado = ingerir(
            intervalo=argumentos.intervalo,
            con_municipios=not argumentos.sin_municipios,
            catalogo_path=argumentos.catalogo,
            tope_peticiones=argumentos.tope,
        )
    except ErrorIngesta as exc:
        print(f"Error de ingesta: {exc}", file=sys.stderr)
        return 1

    with open(argumentos.salida, "w", encoding="utf-8") as archivo:
        json.dump(resultado, archivo, ensure_ascii=False, indent=2)

    procedencia = resultado["procedencia"]
    totales = resultado["datos"].get("totales", {})
    print(f"Escrito: {argumentos.salida}")
    print(f"Consulta: {procedencia['consultado_utc']}")
    print(f"Peticiones: {procedencia['peticiones_realizadas']}")
    if totales:
        print(f"Total global: {totales.get('total_global'):,}")
        print(f"Desaparecidos y no localizados: "
              f"{totales.get('desaparecidos_y_no_localizados'):,}")
    por_mun = resultado["datos"].get("por_municipio") or []
    if por_mun:
        n_mun = sum(len(e.get("municipios") or []) for e in por_mun)
        print(f"Municipios en snapshot: {n_mun} (en {len(por_mun)} entidades)")
    if resultado["bloques_no_obtenidos"]:
        print(f"Bloques no obtenidos: {list(resultado['bloques_no_obtenidos'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
