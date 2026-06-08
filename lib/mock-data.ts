import type { AlertaAmber, EstadoData, Noticia } from "./types";

export const ESTADOS_DATA: EstadoData[] = [
  { id: "MX-JAL", nombre: "Jalisco", lat: 20.6597, lng: -103.3496, total: 8421, nuevos30d: 312, localizados: 1204, mujeres: 3820, hombres: 4601, municipioAlto: "Guadalajara" },
  { id: "MX-MEX", nombre: "Estado de México", lat: 19.2952, lng: -99.8618, total: 7183, nuevos30d: 287, localizados: 982, mujeres: 3901, hombres: 3282, municipioAlto: "Ecatepec" },
  { id: "MX-TAM", nombre: "Tamaulipas", lat: 24.2669, lng: -98.8363, total: 6944, nuevos30d: 198, localizados: 611, mujeres: 2100, hombres: 4844, municipioAlto: "Reynosa" },
  { id: "MX-VER", nombre: "Veracruz", lat: 19.1738, lng: -96.1342, total: 6230, nuevos30d: 221, localizados: 788, mujeres: 2890, hombres: 3340, municipioAlto: "Xalapa" },
  { id: "MX-SIN", nombre: "Sinaloa", lat: 24.8091, lng: -107.394, total: 5871, nuevos30d: 176, localizados: 543, mujeres: 1980, hombres: 3891, municipioAlto: "Culiacán" },
  { id: "MX-GRO", nombre: "Guerrero", lat: 17.4392, lng: -99.5451, total: 5634, nuevos30d: 204, localizados: 498, mujeres: 2341, hombres: 3293, municipioAlto: "Acapulco" },
  { id: "MX-CDM", nombre: "Ciudad de México", lat: 19.4326, lng: -99.1332, total: 4912, nuevos30d: 143, localizados: 1102, mujeres: 2781, hombres: 2131, municipioAlto: "Iztapalapa" },
  { id: "MX-CHH", nombre: "Chihuahua", lat: 28.6353, lng: -106.0889, total: 4788, nuevos30d: 167, localizados: 621, mujeres: 2190, hombres: 2598, municipioAlto: "Cd. Juárez" },
  { id: "MX-NLE", nombre: "Nuevo León", lat: 25.5922, lng: -99.9962, total: 3921, nuevos30d: 134, localizados: 744, mujeres: 1820, hombres: 2101, municipioAlto: "Monterrey" },
  { id: "MX-MIC", nombre: "Michoacán", lat: 19.5665, lng: -101.7068, total: 3744, nuevos30d: 156, localizados: 512, mujeres: 1654, hombres: 2090, municipioAlto: "Morelia" },
  { id: "MX-OAX", nombre: "Oaxaca", lat: 17.0732, lng: -96.7266, total: 3102, nuevos30d: 98, localizados: 431, mujeres: 1543, hombres: 1559, municipioAlto: "Oaxaca de Juárez" },
  { id: "MX-PUE", nombre: "Puebla", lat: 19.0414, lng: -98.2063, total: 2987, nuevos30d: 112, localizados: 489, mujeres: 1411, hombres: 1576, municipioAlto: "Puebla" },
  { id: "MX-SON", nombre: "Sonora", lat: 29.2972, lng: -110.3309, total: 2834, nuevos30d: 89, localizados: 367, mujeres: 1102, hombres: 1732, municipioAlto: "Hermosillo" },
  { id: "MX-COA", nombre: "Coahuila", lat: 27.0587, lng: -101.7068, total: 2561, nuevos30d: 77, localizados: 312, mujeres: 1043, hombres: 1518, municipioAlto: "Saltillo" },
  { id: "MX-BCS", nombre: "Baja California", lat: 30.8406, lng: -115.2838, total: 2312, nuevos30d: 94, localizados: 298, mujeres: 987, hombres: 1325, municipioAlto: "Tijuana" },
];

export const ALERTAS_AMBER: AlertaAmber[] = [
  { id: 1, nombre: "Sofía R. M.", edad: 14, estado: "Jalisco", municipio: "Guadalajara", fecha: "2026-06-05", activa: true, descripcion: "Cabello negro, tez morena, 1.58m. Última vez vista en Av. Patria" },
  { id: 2, nombre: "Kevin A. L.", edad: 9, estado: "Estado de México", municipio: "Ecatepec", fecha: "2026-06-04", activa: true, descripcion: "Cabello castaño, ojos cafés, 1.32m. Desapareció en Blvd. Aztecas" },
  { id: 3, nombre: "Valentina C.", edad: 16, estado: "Veracruz", municipio: "Xalapa", fecha: "2026-06-03", activa: true, descripcion: "Cabello rubio, tez blanca, 1.62m. Lleva uniforme escolar azul" },
  { id: 4, nombre: "Diego F. R.", edad: 11, estado: "Nuevo León", municipio: "Monterrey", fecha: "2026-06-02", activa: true, descripcion: "Cabello negro corto, 1.40m. Visto por última vez en Col. Independencia" },
  { id: 5, nombre: "Camila G. V.", edad: 15, estado: "Chihuahua", municipio: "Cd. Juárez", fecha: "2026-06-01", activa: false, descripcion: "LOCALIZADA CON BIEN — Caso cerrado" },
];

export const NOTICIAS: Noticia[] = [
  { id: "1", titulo: "Colectivo de búsqueda localiza 3 fosas clandestinas en Jalisco", fuente: "Animal Político", hora: "hace 2h", estado: "Jalisco", tipo: "hallazgo" },
  { id: "2", titulo: "CNBP reporta aumento del 21% en desapariciones en primer semestre 2025", fuente: "Reforma", hora: "hace 4h", estado: "Nacional", tipo: "estadistica" },
  { id: "3", titulo: "Familias buscadoras de Tamaulipas denuncian obstaculización de autoridades", fuente: "Proceso", hora: "hace 6h", estado: "Tamaulipas", tipo: "denuncia" },
  { id: "4", titulo: "Plataforma Única de Identidad entra en operaciones piloto en 5 estados", fuente: "El Universal", hora: "hace 8h", estado: "Nacional", tipo: "institucional" },
  { id: "5", titulo: "GIZ y OAJ firman convenio para fortalecer búsqueda de personas en circuitos judiciales", fuente: "CNDH", hora: "hace 12h", estado: "Nacional", tipo: "institucional" },
  { id: "6", titulo: "Madre buscadora de Sinaloa recibe amenazas tras localizar restos en predio", fuente: "Sin Embargo", hora: "hace 14h", estado: "Sinaloa", tipo: "denuncia" },
  { id: "7", titulo: "Colectivo FUNDEM exige auditoría al RNPDNO por presuntos registros duplicados", fuente: "FUNDEM", hora: "hace 1d", estado: "Nacional", tipo: "denuncia" },
  { id: "8", titulo: "Alerta Alba activada en Guerrero por mujer de 34 años desaparecida en Tlapa", fuente: "FGR", hora: "hace 1d", estado: "Guerrero", tipo: "alerta" },
];
