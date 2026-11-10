import { NextResponse, type NextRequest } from "next/server";

/**
 * CSP por petición con nonce.
 *
 * Genera un nonce único por respuesta y lo aplica a `script-src` junto con
 * `'strict-dynamic'`, de modo que solo se ejecutan los scripts del propio Next
 * (que reciben el nonce automáticamente) y los que estos carguen. Esto elimina
 * la necesidad de `'unsafe-inline'` en scripts y mitiga XSS en profundidad.
 *
 * `style-src` mantiene `'unsafe-inline'` porque React (atributos `style=`) y
 * MapLibre lo requieren; migrar a nonces de estilo exigiría refactor mayor.
 *
 * Las demás cabeceras de seguridad (X-Frame-Options, nosniff, etc.) se definen
 * en `next.config.ts`. Aquí solo se gestiona la CSP por su naturaleza dinámica.
 */
export function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());

  const csp = [
    "default-src 'self'",
    // React en desarrollo usa eval() para reconstruir callstacks; en producción no.
    process.env.NODE_ENV === "development"
      ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https:",
    "worker-src 'self' blob:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "form-action 'self'",
  ].join("; ");

  // Next lee el nonce desde la cabecera de la petición y lo inyecta en sus
  // scripts; además devolvemos la CSP en la respuesta.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Aplica a documentos HTML; excluye API, assets estáticos y prefetches.
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
