#!/usr/bin/env python3
"""
Genera geometría municipal simplificada + catálogo CVEGEO para RASTRO.

Fuente: Catálogo Único de Claves Geoestadísticas (INEGI), endpoint
https://gaia.inegi.org.mx/wscatgeo/v2/geo/mgem/{cve_ent}

Salidas:
  public/geo/municipios/{01..32}.geojson  — un FeatureCollection por entidad
  public/data/municipios-catalogo.json    — índice CVEGEO ↔ nombre ↔ entidad

Uso:
  pip install -r scripts/requirements.txt
  python scripts/build_municipios_geo.py
"""

from __future__ import annotations

import argparse
import json
import ssl
import sys
import time
import urllib.request
from pathlib import Path

try:
    import certifi
except ImportError:
    certifi = None  # type: ignore

try:
    from shapely.geometry import mapping, shape
    from shapely.validation import make_valid
except ImportError as exc:  # pragma: no cover
    raise SystemExit(
        "Se requiere shapely. Instala con: pip install -r scripts/requirements.txt"
    ) from exc


def _ssl_context() -> ssl.SSLContext:
    if certifi is not None:
        return ssl.create_default_context(cafile=certifi.where())
    return ssl.create_default_context()

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_GEO_DIR = ROOT / "public" / "geo" / "municipios"
DEFAULT_CATALOG = ROOT / "public" / "data" / "municipios-catalogo.json"
INEGI_GEO = "https://gaia.inegi.org.mx/wscatgeo/v2/geo/mgem/{cve_ent}"
USER_AGENT = "RASTRO/0.2 (civil-intelligence; +https://github.com/jorgemontiel/RASTRO)"

# Tolerancia en grados (~0.005° ≈ 500 m). Suficiente para choropleth web.
SIMPLIFY_TOLERANCE = 0.005


def fetch_estado(cve_ent: str, timeout: int = 60) -> dict:
    url = INEGI_GEO.format(cve_ent=cve_ent)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout, context=_ssl_context()) as resp:
        return json.loads(resp.read().decode("utf-8"))


def simplify_feature(feature: dict, tolerance: float) -> dict | None:
    props = feature.get("properties") or {}
    cvegeo = str(props.get("cvegeo") or "").zfill(5)
    if len(cvegeo) != 5:
        return None
    geom = feature.get("geometry")
    if not geom:
        return None
    try:
        g = shape(geom)
        if not g.is_valid:
            g = make_valid(g)
        g = g.simplify(tolerance, preserve_topology=True)
        if g.is_empty:
            return None
    except Exception:
        return None

    return {
        "type": "Feature",
        "properties": {
            "CVEGEO": cvegeo,
            "CVE_ENT": cvegeo[:2],
            "CVE_MUN": cvegeo[2:],
            "NOM_MUN": str(props.get("nomgeo") or props.get("NOM_MUN") or ""),
        },
        "geometry": mapping(g),
    }


def build(geo_dir: Path, catalog_path: Path, tolerance: float, pause: float) -> None:
    geo_dir.mkdir(parents=True, exist_ok=True)
    catalog_path.parent.mkdir(parents=True, exist_ok=True)

    catalog: list[dict[str, str]] = []
    total_features = 0
    sizes: list[int] = []

    for n in range(1, 33):
        cve_ent = f"{n:02d}"
        print(f"→ {cve_ent} …", flush=True)
        raw = fetch_estado(cve_ent)
        features_in = raw.get("features") or []
        features_out: list[dict] = []
        for feat in features_in:
            simplified = simplify_feature(feat, tolerance)
            if not simplified:
                continue
            features_out.append(simplified)
            props = simplified["properties"]
            catalog.append({
                "cvegeo": props["CVEGEO"],
                "nombre": props["NOM_MUN"],
                "cve_ent": props["CVE_ENT"],
            })

        collection = {"type": "FeatureCollection", "features": features_out}
        out_path = geo_dir / f"{cve_ent}.geojson"
        text = json.dumps(collection, ensure_ascii=False, separators=(",", ":"))
        out_path.write_text(text, encoding="utf-8")
        sizes.append(out_path.stat().st_size)
        total_features += len(features_out)
        print(f"  {len(features_out)} municipios → {out_path.stat().st_size / 1024:.0f} KB")
        if pause > 0 and n < 32:
            time.sleep(pause)

    catalog.sort(key=lambda row: row["cvegeo"])
    catalog_doc = {
        "fuente": "INEGI Catálogo Único de Claves Geoestadísticas (wscatgeo v2 geo/mgem)",
        "url": "https://gaia.inegi.org.mx/wscatgeo/v2/geo/mgem/{cve_ent}",
        "simplify_tolerance_deg": tolerance,
        "total": len(catalog),
        "municipios": catalog,
    }
    catalog_path.write_text(
        json.dumps(catalog_doc, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    total_bytes = sum(sizes)
    print(
        f"\nListo: {total_features} municipios en {geo_dir} "
        f"({total_bytes / 1e6:.2f} MB) + catálogo {catalog_path}",
        flush=True,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--geo-dir", type=Path, default=DEFAULT_GEO_DIR)
    parser.add_argument("--catalog", type=Path, default=DEFAULT_CATALOG)
    parser.add_argument("--tolerance", type=float, default=SIMPLIFY_TOLERANCE)
    parser.add_argument("--pause", type=float, default=0.4, help="Pausa entre entidades (s)")
    args = parser.parse_args()
    build(args.geo_dir, args.catalog, args.tolerance, args.pause)
    return 0


if __name__ == "__main__":
    sys.exit(main())
