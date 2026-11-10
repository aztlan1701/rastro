import type { NextConfig } from "next";

/**
 * Cabeceras de seguridad estáticas aplicadas a todas las rutas.
 *
 * La Content-Security-Policy NO se define aquí: se genera por petición en
 * `proxy.ts` con un nonce por respuesta (script-src con nonce +
 * 'strict-dynamic'). Estas cabeceras son las que no dependen de la petición.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
