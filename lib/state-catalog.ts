export interface StateCatalogEntry {
  id: string;
  nombre: string;
  lat: number;
  lng: number;
  aliases: string[];
}

export const STATE_CATALOG: StateCatalogEntry[] = [
  { id: "MX-AGU", nombre: "Aguascalientes", lat: 21.8853, lng: -102.2916, aliases: ["aguascalientes"] },
  { id: "MX-BCN", nombre: "Baja California", lat: 30.8406, lng: -115.2838, aliases: ["baja california", "bc"] },
  { id: "MX-BCS", nombre: "Baja California Sur", lat: 24.1426, lng: -110.3128, aliases: ["baja california sur", "bcs"] },
  { id: "MX-CAM", nombre: "Campeche", lat: 19.8301, lng: -90.5349, aliases: ["campeche"] },
  { id: "MX-COA", nombre: "Coahuila", lat: 27.0587, lng: -101.7068, aliases: ["coahuila", "coahuila de zaragoza"] },
  { id: "MX-COL", nombre: "Colima", lat: 19.2452, lng: -103.7241, aliases: ["colima"] },
  { id: "MX-CHP", nombre: "Chiapas", lat: 16.7569, lng: -93.1292, aliases: ["chiapas"] },
  { id: "MX-CHH", nombre: "Chihuahua", lat: 28.6353, lng: -106.0889, aliases: ["chihuahua"] },
  { id: "MX-CDM", nombre: "Ciudad de México", lat: 19.4326, lng: -99.1332, aliases: ["ciudad de mexico", "cdmx", "distrito federal", "cd mx"] },
  { id: "MX-DUR", nombre: "Durango", lat: 24.0277, lng: -104.6532, aliases: ["durango"] },
  { id: "MX-GUA", nombre: "Guanajuato", lat: 21.019, lng: -101.2574, aliases: ["guanajuato"] },
  { id: "MX-GRO", nombre: "Guerrero", lat: 17.4392, lng: -99.5451, aliases: ["guerrero"] },
  { id: "MX-HID", nombre: "Hidalgo", lat: 20.0911, lng: -98.7624, aliases: ["hidalgo"] },
  { id: "MX-JAL", nombre: "Jalisco", lat: 20.6597, lng: -103.3496, aliases: ["jalisco"] },
  { id: "MX-MEX", nombre: "Estado de México", lat: 19.2952, lng: -99.8618, aliases: ["estado de mexico", "mexico", "edomex", "estado de méxico"] },
  { id: "MX-MIC", nombre: "Michoacán", lat: 19.5665, lng: -101.7068, aliases: ["michoacan", "michoacán", "michoacan de ocampo"] },
  { id: "MX-MOR", nombre: "Morelos", lat: 18.6813, lng: -99.1013, aliases: ["morelos"] },
  { id: "MX-NAY", nombre: "Nayarit", lat: 21.7514, lng: -104.8455, aliases: ["nayarit"] },
  { id: "MX-NLE", nombre: "Nuevo León", lat: 25.5922, lng: -99.9962, aliases: ["nuevo leon", "nuevo león"] },
  { id: "MX-OAX", nombre: "Oaxaca", lat: 17.0732, lng: -96.7266, aliases: ["oaxaca"] },
  { id: "MX-PUE", nombre: "Puebla", lat: 19.0414, lng: -98.2063, aliases: ["puebla"] },
  { id: "MX-QUE", nombre: "Querétaro", lat: 20.5888, lng: -100.3899, aliases: ["queretaro", "querétaro"] },
  { id: "MX-ROO", nombre: "Quintana Roo", lat: 19.1817, lng: -88.4791, aliases: ["quintana roo"] },
  { id: "MX-SLP", nombre: "San Luis Potosí", lat: 22.1565, lng: -100.9855, aliases: ["san luis potosi", "san luis potosí"] },
  { id: "MX-SIN", nombre: "Sinaloa", lat: 24.8091, lng: -107.394, aliases: ["sinaloa"] },
  { id: "MX-SON", nombre: "Sonora", lat: 29.2972, lng: -110.3309, aliases: ["sonora"] },
  { id: "MX-TAB", nombre: "Tabasco", lat: 17.8409, lng: -92.6189, aliases: ["tabasco"] },
  { id: "MX-TAM", nombre: "Tamaulipas", lat: 24.2669, lng: -98.8363, aliases: ["tamaulipas"] },
  { id: "MX-TLA", nombre: "Tlaxcala", lat: 19.3139, lng: -98.2404, aliases: ["tlaxcala"] },
  { id: "MX-VER", nombre: "Veracruz", lat: 19.1738, lng: -96.1342, aliases: ["veracruz", "veracruz de ignacio de la llave"] },
  { id: "MX-YUC", nombre: "Yucatán", lat: 20.7099, lng: -89.0943, aliases: ["yucatan", "yucatán"] },
  { id: "MX-ZAC", nombre: "Zacatecas", lat: 22.7709, lng: -102.5832, aliases: ["zacatecas"] },
];

export function normalizeStateName(raw: string): StateCatalogEntry | null {
  const key = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  return (
    STATE_CATALOG.find(
      (state) =>
        state.nombre
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase() === key || state.aliases.includes(key),
    ) ?? null
  );
}
